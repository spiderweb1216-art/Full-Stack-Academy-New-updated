<?php
declare(strict_types=1);
function websiteContentDefaults(): array {
    $value=json_decode((string)file_get_contents(dirname(__DIR__,2).'/database/website-content.defaults.json'),true);
    if(!is_array($value))throw new RuntimeException('Website content defaults are invalid.');
    return $value;
}
function websiteContent(PDO $pdo): array {return array_replace(websiteContentDefaults(),getSetting($pdo,'website_content',[]));}
function websiteContentRevision(array $content): string {return hash('sha256',(string)json_encode($content,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES));}
function websiteContentValidate(array $content): array {
    $defaults=websiteContentDefaults();
    foreach($content as $key=>$value){
        if(!array_key_exists($key,$defaults))respond(['success'=>false,'message'=>'Unknown website content section.'],422);
        if(is_array($defaults[$key])&&!is_array($value))respond(['success'=>false,'message'=>'Content section '.$key.' must be an object or list.'],422);
    }
    foreach(['heroSlides','stats','faqs','news'] as $key)if(isset($content[$key])&&!array_is_list($content[$key]))respond(['success'=>false,'message'=>$key.' must be a list.'],422);
    foreach($content['heroSlides']??[] as $slide){
        if(!is_array($slide))respond(['success'=>false,'message'=>'Invalid banner.'],422);
        foreach(['image','desktopImage','tabletImage','mobileImage','href'] as $field)if(preg_match('~^(?:javascript|data|vbscript):~i',trim((string)($slide[$field]??''))))respond(['success'=>false,'message'=>'Unsafe banner URL.'],422);
    }
    foreach($content['heroSlides']??[] as $slide){
        foreach(['image','desktopImage','tabletImage','mobileImage'] as $field){
            $url=trim((string)($slide[$field]??''));
            if($url!==''&&!preg_match('~^(?:assets/|uploads/|https?://)~i',$url))respond(['success'=>false,'message'=>'Banner image must use an assets/, uploads/ or HTTPS URL.'],422);
        }
        $link=trim((string)($slide['href']??''));
        if($link!==''&&!preg_match('~^(?:#/|https?://)~i',$link))respond(['success'=>false,'message'=>'Banner link must begin with #/ or http(s)://.'],422);
    }
    $email=trim((string)($content['placementEmail']??''));
    if($email!==''&&!filter_var($email,FILTER_VALIDATE_EMAIL))respond(['success'=>false,'message'=>'Enter a valid placement email.'],422);
    foreach($content['stats']??[] as $stat)if(!is_array($stat)||!isset($stat['label'])||!array_key_exists('value',$stat))respond(['success'=>false,'message'=>'Each statistic needs value and label.'],422);
    foreach(['faqs','courseFaqTemplates','helpFaqExtras'] as $key)foreach($content[$key]??[] as $faq)if(!is_array($faq)||!isset($faq['q'],$faq['a']))respond(['success'=>false,'message'=>'Each FAQ needs q and a.'],422);
    if(isset($content['super40']))foreach(websiteContentDefaults()['super40'] as $key=>$value)if(!isset($content['super40'][$key])||!is_array($content['super40'][$key]))respond(['success'=>false,'message'=>'SUPER40 section '.$key.' is required.'],422);
    foreach($content['translations']??[] as $lang=>$dictionary){
        if($lang!=='hi'||!is_array($dictionary))respond(['success'=>false,'message'=>'Translations must contain a Hindi dictionary.'],422);
        foreach($dictionary as $source=>$translation)if(!is_string($source)||!is_string($translation))respond(['success'=>false,'message'=>'Translation keys and values must be text.'],422);
    }
    $encoded=json_encode($content,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);
    if($encoded===false||strlen($encoded)>4*1024*1024)respond(['success'=>false,'message'=>'Website content exceeds the allowed size.'],422);
    return $content;
}
// One-time preservation of formerly hardcoded public records; never overwrite
// existing administrator data and never re-add records after later deletion.
function ensureLegacyPublicDisplayRecords(PDO $pdo): void {
    if(getSetting($pdo,'dynamic_public_records_v121',[])['done']??false)return;
    $legacy=json_decode((string)file_get_contents(dirname(__DIR__,2).'/database/public-records.legacy.json'),true);
    if(!is_array($legacy))throw new RuntimeException('Public display defaults are invalid.');
    $pdo->beginTransaction();
    try{
        $pdo->prepare("INSERT IGNORE INTO settings(setting_key,setting_value) VALUES('dynamic_public_records_v121','{}')")->execute();
        $lock=$pdo->prepare("SELECT setting_value FROM settings WHERE setting_key='dynamic_public_records_v121' FOR UPDATE");$lock->execute();
        $flag=json_decode((string)$lock->fetchColumn(),true);
        if(!empty($flag['done'])){$pdo->commit();return;}
        foreach($legacy['companies']??[] as $i=>$name){
            $q=$pdo->prepare('SELECT id FROM companies WHERE LOWER(name)=LOWER(?) LIMIT 1');$q->execute([$name]);if($q->fetchColumn())continue;
            $slug=strtolower(trim((string)preg_replace('/[^a-z0-9]+/i','-',$name),'-'));
            $pdo->prepare("INSERT IGNORE INTO companies(slug,name,logo,status,sort_order) VALUES(?,?,?,'published',?)")->execute([$slug,$name,'assets/images/fsa-home/company-logo.svg',$i]);
        }
        foreach($legacy['alumni']??[] as $i=>$r){
            $q=$pdo->prepare('SELECT id FROM alumni WHERE LOWER(name)=LOWER(?) LIMIT 1');$q->execute([$r['name']]);if($q->fetchColumn())continue;
            $slug=strtolower(trim((string)preg_replace('/[^a-z0-9]+/i','-',$r['name']),'-'));
            $pdo->prepare("INSERT IGNORE INTO alumni(slug,name,image,role_title,company,status,sort_order) VALUES(?,?,?,?,?,'published',?)")->execute([$slug,$r['name'],$r['image']??'',$r['role']??'',$r['company']??'',$i]);
        }
        foreach($legacy['reviews']??[] as $i=>$r){
            $q=$pdo->prepare("SELECT id FROM reviews WHERE LOWER(name)=LOWER(?) AND review_type='written' LIMIT 1");$q->execute([$r['name']]);if($q->fetchColumn())continue;
            $pdo->prepare("INSERT INTO reviews(review_type,name,avatar,course_label,rating,review_text,status,sort_order) VALUES('written',?,?,?,?,?,'published',?)")->execute([$r['name'],$r['avatar']??'',$r['course']??'',(int)($r['rating']??5),$r['comment']??'',$i]);
        }
        foreach($legacy['videos']??[] as $i=>$r){
            $q=$pdo->prepare("SELECT id FROM reviews WHERE name=? AND review_type='video' LIMIT 1");$q->execute([$r['label']]);if($q->fetchColumn())continue;
            $pdo->prepare("INSERT INTO reviews(review_type,name,role_label,review_text,video_url,thumbnail,status,sort_order) VALUES('video',?,'Temporary learner-video preview','Stock preview',?,?,'published',?)")->execute([$r['label'],$r['src'],$r['poster'],$i]);
        }
        foreach($legacy['events']??[] as $i=>$r){
            $q=$pdo->prepare('SELECT id FROM events WHERE slug=? LIMIT 1');$q->execute([$r['slug']]);if($q->fetchColumn())continue;
            $date=cleanCertificateDate($r['date']??'');$end=cleanCertificateDate($r['endDate']??'');
            $pdo->prepare("INSERT IGNORE INTO events(slug,title,category,event_date,end_date,time_label,location,address,image,description,registration_url,featured,tags_json,media_json,agenda_json,highlights_json,organiser_json,sponsors_json,status,sort_order) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'published',?)")->execute([$r['slug'],$r['title'],$r['category']??'Academy Event',$date,$end,$r['time']??'',$r['location']??'',$r['address']??'',$r['image']??'',$r['description']??'',$r['registrationUrl']??'',!empty($r['featured'])?1:0,json_encode($r['tags']??[]),json_encode($r['media']??[]),json_encode($r['agenda']??[]),json_encode($r['highlights']??[]),json_encode($r['organiser']??[]),json_encode($r['sponsors']??[]),$i]);
        }
        saveSetting($pdo,'dynamic_public_records_v121',['done'=>true]);$pdo->commit();
    }catch(Throwable $e){if($pdo->inTransaction())$pdo->rollBack();throw $e;}
}
