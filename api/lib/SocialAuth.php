<?php
declare(strict_types=1);
/** Student-only OAuth 2.0 / OpenID Connect bridge. Loaded by api/index.php. */
function socialCfg(string $provider): ?array {
    $spec = [
      'google'=>['https://accounts.google.com/o/oauth2/v2/auth','https://oauth2.googleapis.com/token','https://openidconnect.googleapis.com/v1/userinfo','openid email profile'],
      'microsoft'=>['https://login.microsoftonline.com/common/oauth2/v2.0/authorize','https://login.microsoftonline.com/common/oauth2/v2.0/token','https://graph.microsoft.com/oidc/userinfo','openid email profile'],
      'linkedin'=>['https://www.linkedin.com/oauth/v2/authorization','https://www.linkedin.com/oauth/v2/accessToken','https://api.linkedin.com/v2/userinfo','openid email profile'],
    ];
    if (!isset($spec[$provider])) return null;
    $p=strtoupper($provider);
    $settings=getSetting($GLOBALS['pdo'],'student_integrations',[]);
    $stored=$settings['providers'][$provider]??[];
    if(empty($stored['enabled']))return null;
    $id=trim((string)($stored['client_id']??''));
    $secret=decryptSecret((string)($stored['secret_encrypted']??''),appKey());
    if ($id==='' || $secret==='') return null;
    return ['id'=>$id,'secret'=>$secret,'auth'=>$spec[$provider][0],'token'=>$spec[$provider][1],'userinfo'=>$spec[$provider][2],'scope'=>$spec[$provider][3]];
}
function socialCallbackUrl(): string {
    $base=trim((string)getenv('FSA_SOCIAL_BASE_URL'));
    if (!preg_match('~^https?://[a-zA-Z0-9._:-]+(?:/[a-zA-Z0-9._/-]*)?$~D',$base)) throw new RuntimeException('Set FSA_SOCIAL_BASE_URL to the exact site URL.');
    if (!str_starts_with($base,'https://') && !preg_match('~^http://(?:localhost|127\.0\.0\.1)(?::\d+)?(?:/|$)~',$base)) throw new RuntimeException('HTTPS is required for the live OAuth URL.');
    return rtrim($base,'/').'/api/social-callback.php';
}
function socialHttp(string $url, ?array $form=null, ?string $bearer=null): array {
    if (!function_exists('curl_init')) throw new RuntimeException('Enable PHP cURL extension.');
    $ch=curl_init($url);$headers=['Accept: application/json'];
    $opts=[CURLOPT_RETURNTRANSFER=>true,CURLOPT_TIMEOUT=>15,CURLOPT_CONNECTTIMEOUT=>7,CURLOPT_FOLLOWLOCATION=>false,CURLOPT_SSL_VERIFYPEER=>true,CURLOPT_HTTPHEADER=>&$headers];
    if ($form!==null){$opts[CURLOPT_POST]=true;$opts[CURLOPT_POSTFIELDS]=http_build_query($form);$headers[]='Content-Type: application/x-www-form-urlencoded';}
    if ($bearer!==null)$headers[]='Authorization: Bearer '.$bearer;
    curl_setopt_array($ch,$opts);$response=curl_exec($ch);$code=curl_getinfo($ch,CURLINFO_HTTP_CODE);curl_close($ch);
    if (!is_string($response)||$code<200||$code>=300) throw new RuntimeException('Identity provider could not verify the login.');
    $obj=json_decode($response,true);if(!is_array($obj))throw new RuntimeException('Unexpected provider response.');return $obj;
}
function socialErrorRedirect(string $message): never {
    unset($_SESSION['social_pending']);
    header('Location: ../index.html?social_error='.rawurlencode($message).'#/login',true,303);exit;
}
function socialHandle(PDO $pdo,string $action): never {
    try {
        if ($_SERVER['REQUEST_METHOD']!=='GET') socialErrorRedirect('Invalid sign-in request.');
        if ($action==='auth_social_start') {
            $provider=strtolower(clean($_GET['provider']??'',24));
            $cfg=socialCfg($provider);
            if(!$cfg)socialErrorRedirect('This sign-in provider is not configured yet.');
            $site=array_replace(siteDefaults(),getSetting($pdo,'site',[]));
            if(!boolValue($site['registration_enabled']??true)) { /* Existing students can still log in */ }
            $state=bin2hex(random_bytes(24));$verifier=rtrim(strtr(base64_encode(random_bytes(48)),'+/','-_'),'=');
            $_SESSION['social_pending']=['provider'=>$provider,'state'=>$state,'verifier'=>$verifier,'created'=>time()];
            $args=['response_type'=>'code','client_id'=>$cfg['id'],'redirect_uri'=>socialCallbackUrl(),'scope'=>$cfg['scope'],'state'=>$state,'code_challenge'=>rtrim(strtr(base64_encode(hash('sha256',$verifier,true)),'+/','-_'),'='),'code_challenge_method'=>'S256'];
            header('Location: '.$cfg['auth'].'?'.http_build_query($args,'','&',PHP_QUERY_RFC3986),true,302);exit;
        }
        $pending=$_SESSION['social_pending']??null;unset($_SESSION['social_pending']);
        if(!is_array($pending)||time()-(int)($pending['created']??0)>600||!hash_equals((string)($pending['state']??''),(string)($_GET['state']??'')))socialErrorRedirect('Sign-in session expired. Try again.');
        if(isset($_GET['error']))socialErrorRedirect('Sign-in was cancelled or not authorized.');
        $code=(string)($_GET['code']??'');if($code==='')socialErrorRedirect('Sign-in authorization code missing.');
        $provider=(string)$pending['provider'];$cfg=socialCfg($provider);if(!$cfg)socialErrorRedirect('Provider is not configured.');
        $tokens=socialHttp($cfg['token'],['grant_type'=>'authorization_code','client_id'=>$cfg['id'],'client_secret'=>$cfg['secret'],'redirect_uri'=>socialCallbackUrl(),'code'=>$code,'code_verifier'=>$pending['verifier']]);
        $access=(string)($tokens['access_token']??'');if($access==='')throw new RuntimeException('Identity provider did not return an access token.');
        $person=socialHttp($cfg['userinfo'],null,$access);
        $subject=clean($person['sub']??'',255);$email=strtolower(clean($person['email']??'',190));
        $name=clean($person['name']??$person['given_name']??'',120);
        if($subject===''||!filter_var($email,FILTER_VALIDATE_EMAIL))socialErrorRedirect('A verified email address is required. Use password sign-in or another provider.');
        // Do not merge identities by email alone, or permit external logins to inherit staff privileges.
        if($provider==='google' && empty($person['email_verified']))socialErrorRedirect('Your Google email is not verified.');
        if($provider==='linkedin' && empty($person['email_verified']))socialErrorRedirect('Your LinkedIn email is not verified.');
        $pdo->beginTransaction();
        $find=$pdo->prepare('SELECT u.* FROM social_identities s JOIN users u ON u.id=s.user_id WHERE s.provider=? AND s.provider_subject=? LIMIT 1');$find->execute([$provider,$subject]);$user=$find->fetch(PDO::FETCH_ASSOC);
        if($user){
            if($user['role']!=='student'||$user['status']!=='active'){ $pdo->rollBack();socialErrorRedirect('This account cannot use student social sign-in.'); }
        }else{
            $exists=$pdo->prepare('SELECT id FROM users WHERE LOWER(email)=LOWER(?) LIMIT 1');$exists->execute([$email]);
            if($exists->fetchColumn()){ $pdo->rollBack();socialErrorRedirect('This email already has an account. Sign in using your existing method. Account linking requires verified account access.'); }
            $site=array_replace(siteDefaults(),getSetting($pdo,'site',[]));
            if(!boolValue($site['registration_enabled']??true)){ $pdo->rollBack();socialErrorRedirect('New student registration is disabled.'); }
            $codeId=generateStudentCode($pdo);$safeName=$name?:explode('@',$email)[0];
            $stmt=$pdo->prepare("INSERT INTO users (name,email,phone,password_hash,role,status,headline,bio,country,student_code,branch,skills_json) VALUES (?,?,?,?,'student','active','Full Stack Academy Learner','','India',?, '', '[]')");
            $stmt->execute([$safeName,$email,'',password_hash(bin2hex(random_bytes(32)),PASSWORD_DEFAULT),$codeId]);$id=(int)$pdo->lastInsertId();
            $pdo->prepare('INSERT INTO student_profiles (user_id) VALUES (?)')->execute([$id]);
            $pdo->prepare('UPDATE users SET public_slug=? WHERE id=?')->execute([profileSlug($safeName,$id),$id]);
            $pdo->prepare('INSERT INTO social_identities (user_id,provider,provider_subject) VALUES (?,?,?)')->execute([$id,$provider,$subject]);
            $u=$pdo->prepare('SELECT * FROM users WHERE id=?');$u->execute([$id]);$user=$u->fetch(PDO::FETCH_ASSOC);
        }
        $pdo->prepare('UPDATE users SET last_login_at=NOW() WHERE id=?')->execute([$user['id']]);$pdo->commit();
        session_regenerate_id(true);$_SESSION['student_user_id']=(int)$user['id'];$_SESSION['user_id']=(int)$user['id'];issueRememberToken($pdo,(int)$user['id']);
        header('Location: ../index.html?social_success=1#/dashboard',true,303);exit;
    } catch(Throwable $e){if($pdo->inTransaction())$pdo->rollBack();error_log('[FSA Social Login] '.$e->getMessage());socialErrorRedirect('Social sign-in is unavailable. Check provider settings and database migration.');}
}
