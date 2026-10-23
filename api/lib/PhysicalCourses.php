<?php
declare(strict_types=1);
/** Physical / Offline course pages: isolated from recorded and live course content. */
/**
 * Page editing needs only physical_course_pages. Learner submission endpoints
 * explicitly request physical_course_submissions as well; failure to create the
 * latter must not block the admin page builder.
 */
function physicalEnsureTables(PDO $pdo, bool $includeSubmissions = true): void {
    // Existing installations may use a database user without CREATE grants.
    // Read existing tables first; create only the missing tables.
    $exists = static function(string $table) use ($pdo): bool {
        try { $pdo->query("SELECT 1 FROM `{$table}` LIMIT 0"); return true; }
        catch (PDOException $e) {
            // 42S02 = unknown table. Other failures should not be mistaken for absent tables.
            if ((string)$e->getCode() !== '42S02') throw $e;
            return false;
        }
    };
    if (!$exists('physical_course_pages')) {
    $pdo->exec("CREATE TABLE IF NOT EXISTS physical_course_pages (
        course_id BIGINT UNSIGNED NOT NULL PRIMARY KEY,
        sections_json LONGTEXT NOT NULL,
        updated_by BIGINT UNSIGNED NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_physical_page_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    }
    if (!$includeSubmissions) return;
    if (!$exists('physical_course_submissions')) {
    $pdo->exec("CREATE TABLE IF NOT EXISTS physical_course_submissions (
        user_id BIGINT UNSIGNED NOT NULL,
        course_id BIGINT UNSIGNED NOT NULL,
        block_id VARCHAR(64) NOT NULL,
        content_hash CHAR(64) NOT NULL,
        answer_text TEXT NOT NULL,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id,course_id,block_id),
        INDEX idx_physical_submission_course (course_id),
        CONSTRAINT fk_physical_submit_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
        CONSTRAINT fk_physical_submit_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    }
}
/**
 * Safe, actionable error text. Database names, SQL strings, file paths and
 * credentials are never reflected in the browser. Full exception is logged.
 */
function physicalStorageUserMessage(Throwable $error): string {
    $number = $error instanceof PDOException ? (int)($error->errorInfo[1] ?? 0) : 0;
    $sqlState = (string)$error->getCode();
    if ($number === 1146 || $sqlState === '42S02') {
        return 'A physical-course storage table is missing. Import database/physical-course-storage-v128.sql in phpMyAdmin and reload.';
    }
    if (in_array($number, [1044,1045,1142,1143,1227], true)) {
        return 'MySQL permissions prevent access to physical-course storage. Check SELECT, INSERT, UPDATE and CREATE grants for the website database account.';
    }
    if (in_array($number, [1005,1215,1824,3780], true)) {
        return 'MySQL could not create the physical-course tables because of a foreign-key/schema mismatch. Verify courses.id and users.id match BIGINT UNSIGNED; see PHP log.';
    }
    if ($number === 1054 || $sqlState === '42S22') {
        return 'Physical-course page storage has an incompatible column layout. This v129 patch supports page_json and sections_json; see PHP log if the issue persists.';
    }
    if (in_array($number, [1049,2002,2003,2006], true)) {
        return 'The MySQL database is unavailable or misconfigured. Start MySQL in XAMPP and verify api/config/database.php.';
    }
    return 'Physical-course database access failed'.($number ? ' (MySQL error '.$number.')' : '').'. Check the PHP error log and import the v128 storage SQL if needed.';
}
function physicalModeEnabled(array $course): bool {
    $modes=jsonArray($course['delivery_modes_json'] ?? '[]');
    return in_array('offline',$modes,true) || (!$modes && ($course['delivery_mode']??'offline')==='offline');
}
function physicalCourse(PDO $pdo,int $id,bool $allowEnrolledHistoricalAccess=false): array {
    $q=$pdo->prepare('SELECT * FROM courses WHERE id=? LIMIT 1');$q->execute([$id]);
    $course=$q->fetch();if(!$course) respond(['success'=>false,'message'=>'Course not found.'],404);
    if(!physicalModeEnabled($course) && !$allowEnrolledHistoricalAccess) respond(['success'=>false,'message'=>'This course does not have Physical / Offline enabled.'],422);
    return $course;
}
function physicalCanEdit(PDO $pdo,array $admin,array $course): void {
    if(isCentralAdmin($admin)) return;
    if(adminRole($admin)==='instructor') {
        respond(['success'=>false,'message'=>'Physical private pages are managed by academy administrators, not instructors.'],403);
    }
    if(isBranchManager($admin) && courseBelongsToBranch($pdo,$course,cleanBranchName($admin))) return;
    respond(['success'=>false,'message'=>'You cannot edit a course belonging to another branch.'],403);
}
function physicalBlockId(mixed $value): string {
    $id=(string)$value;
    return preg_match('/^[a-zA-Z0-9_-]{3,64}$/D',$id)?$id:bin2hex(random_bytes(8));
}
function physicalSafeUrl(mixed $value): string {
    return normalizeHttpUrl($value,2048);
}
function physicalNormalize(mixed $raw): array {
    $allowed=['banner','heading','paragraph','image','gallery','callout','download','quiz','assignment','code','divider'];
    $result=[];$seen=[];
    foreach(array_slice(jsonArray($raw),0,100) as $si=>$section){
        if(!is_array($section))continue;
        $id=physicalBlockId($section['id']??'');if(isset($seen[$id]))$id=bin2hex(random_bytes(8));$seen[$id]=1;
        $title=clean($section['title']??'',190);
        if($title==='') $title='Section '.($si+1);
        $blocks=[];
        foreach(array_slice(jsonArray($section['blocks']??[]),0,120) as $rawBlock){
            if(!is_array($rawBlock))continue;
            $type=(string)($rawBlock['type']??'paragraph');
            // Original physical builder used 'text' for paragraphs.
            if($type==='text')$type='paragraph';
            if(!in_array($type,$allowed,true))continue;
            $bid=physicalBlockId($rawBlock['id']??'');if(isset($seen[$bid]))$bid=bin2hex(random_bytes(8));$seen[$bid]=1;
            $urls=[];
            foreach(array_slice(jsonArray($rawBlock['images']??[]),0,16) as $url){$safe=physicalSafeUrl($url);if($safe!=='')$urls[]=$safe;}
            $choices=[];
            foreach(array_slice(jsonArray($rawBlock['choices']??$rawBlock['options']??[]),0,8) as $choice){$choices[]=clean(is_scalar($choice)?$choice:'',350);}
            $correct=max(0,min(max(count($choices)-1,0),(int)($rawBlock['correct']??0)));
            $questions=[];
            if($type==='quiz'){
                $rawQuestions=jsonArray($rawBlock['questions']??[]);
                foreach(array_slice($rawQuestions,0,20) as $qi=>$question){
                    if(!is_array($question))continue;
                    $questionChoices=[];
                    foreach(array_slice(jsonArray($question['choices']??$question['options']??[]),0,8) as $choice){$questionChoices[]=clean(is_scalar($choice)?$choice:'',350);}
                    if(!$questionChoices)$questionChoices=['Option A','Option B'];
                    $questionCorrect=max(0,min(count($questionChoices)-1,(int)($question['correct']??0)));
                    $questions[]=[
                        'id'=>physicalBlockId($question['id']??('q_'.$qi)),
                        'prompt'=>clean($question['prompt']??$question['text']??'',5000),
                        'choices'=>$questionChoices,
                        'correct'=>$questionCorrect
                    ];
                }
                if(!$questions){
                    if(!$choices)$choices=['Option A','Option B'];
                    $questions[]=['id'=>physicalBlockId('q0'),'prompt'=>clean($rawBlock['text']??'',5000),'choices'=>$choices,'correct'=>$correct];
                }
                $choices=$questions[0]['choices'];
                $correct=$questions[0]['correct'];
            }
            $blocks[]=[
                'id'=>$bid,'type'=>$type,'title'=>clean($rawBlock['title']??'',220),
                'text'=>clean($rawBlock['text']??'',30000),
                'url'=>physicalSafeUrl($rawBlock['url']??''),'images'=>$urls,
                'choices'=>$choices,'correct'=>$correct,'questions'=>$questions,
                'language'=>in_array(strtolower((string)($rawBlock['language']??'text')),['html','css','javascript','jsx','json','python','php','sql','bash','text'],true)?strtolower((string)$rawBlock['language']):'text',
                'required'=>in_array($type,['quiz','assignment'],true) && boolValue($rawBlock['required']??false)
            ];
        }
        // Section metadata is stored alongside the existing widget array so
        // older page_json and new sections_json databases both remain compatible.
        $kind=(string)($section['kind']??'');
        if($kind==='') {
            // Label older, single-activity sections correctly in the lesson TOC.
            if(count($blocks)===1 && in_array($blocks[0]['type'],['quiz','assignment'],true))$kind=$blocks[0]['type'];
            else $kind='lesson';
        }
        if(!in_array($kind,['lesson','quiz','assignment'],true))$kind='lesson';
        $result[]=[
            'id'=>$id,'title'=>$title,
            'module'=>clean($section['module']??'Course introduction',190)?:'Course introduction',
            'kind'=>$kind,
            'description'=>clean($section['description']??'',3000),
            'blocks'=>$blocks
        ];
    }
    return $result;
}
function physicalSample(): array {
    // Exactly one demonstration page, only for the first eligible physical course.
    return physicalNormalize([
      ['id'=>'sample_introduction','title'=>'Getting started','blocks'=>[
        ['id'=>'sample_welcome','type'=>'heading','title'=>'Welcome to your classroom course'],
        ['id'=>'sample_intro','type'=>'paragraph','text'=>'This is demonstration private lesson content. Meet your instructor, check your class schedule and work through the activities in order. Your academy can replace every block in the Physical Courses editor.'],
        ['id'=>'sample_note','type'=>'callout','title'=>'Before your first class','text'=>'Bring a notebook and your laptop. Follow your branch instructor for attendance and practical tasks.'],
      ]],
      ['id'=>'sample_foundations','title'=>'Practice and assessment','blocks'=>[
        ['id'=>'sample_activity','type'=>'paragraph','title'=>'Your first practice task','text'=>'Write three learning goals for this course. Discuss them with your instructor and keep a copy in your notes.'],
        ['id'=>'sample_quiz','type'=>'quiz','title'=>'Knowledge check','text'=>'Which learning format is this private area for?','choices'=>['Physical classroom','Recorded-only course','Live-stream-only course'],'correct'=>0,'required'=>true],
        ['id'=>'sample_assignment','type'=>'assignment','title'=>'Submit your learning goals','text'=>'Type at least ten characters describing your goals, then submit to finish this section.','required'=>true]
      ]]
    ]);
}
/**
 * The user's original physical pages use page_json (object with a sections key).
 * Later pages use sections_json (a JSON array). Both are legitimate layouts.
 * Select only constant, whitelisted field names; do not require database DDL.
 */
function physicalPageStorageColumn(PDO $pdo): string {
    try {
        $pdo->query('SELECT sections_json FROM physical_course_pages LIMIT 0');
        return 'sections_json';
    } catch (PDOException $e) {
        $mysqlNumber=(int)($e->errorInfo[1]??0);
        if($mysqlNumber!==1054 && (string)$e->getCode()!=='42S22')throw $e;
    }
    // The original LMS database dump has page_json, not sections_json.
    $pdo->query('SELECT page_json FROM physical_course_pages LIMIT 0');
    return 'page_json';
}
function physicalRead(PDO $pdo,int $courseId): array {
    $column=physicalPageStorageColumn($pdo);
    $q=$pdo->prepare('SELECT `'.$column.'` FROM physical_course_pages WHERE course_id=? LIMIT 1');
    $q->execute([$courseId]);
    $value=$q->fetchColumn();
    // If the user added sections_json to an existing row but has not migrated
    // its previous data, keep displaying the old page instead of an empty page.
    if(($value===null || $value==='') && $column==='sections_json') {
        try {
            $fallback=$pdo->prepare('SELECT page_json FROM physical_course_pages WHERE course_id=? LIMIT 1');
            $fallback->execute([$courseId]);
            $value=$fallback->fetchColumn();
        } catch(PDOException $e) {
            if((int)($e->errorInfo[1]??0)!==1054 && (string)$e->getCode()!=='42S22')throw $e;
        }
    }
    if(!is_string($value)||$value==='')return [];
    $decoded=json_decode($value,true);
    if(!is_array($decoded))return [];
    $sections=array_key_exists('sections',$decoded)?$decoded['sections']:$decoded;
    return physicalNormalize($sections);
}
/** Save without destroying the original page_json metadata or course data. */
function physicalPageHasLegacyColumn(PDO $pdo): bool {
    try {
        $pdo->query('SELECT page_json FROM physical_course_pages LIMIT 0');
        return true;
    } catch (PDOException $e) {
        $mysqlNumber=(int)($e->errorInfo[1]??0);
        if($mysqlNumber===1054 || (string)$e->getCode()==='42S22')return false;
        throw $e;
    }
}
/** Save without destroying the original page_json metadata or course data. */
function physicalSave(PDO $pdo,int $courseId,array $sections,?int $adminId): void {
    $column=physicalPageStorageColumn($pdo);
    $sectionsJson=json_encode($sections,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES|JSON_THROW_ON_ERROR);
    if($column==='sections_json'){
        if(physicalPageHasLegacyColumn($pdo)){
            // Mixed schema: page_json is NOT NULL, so new rows need a value too.
            // Never overwrite page_json on an existing row: it is the legacy backup.
            $q=$pdo->prepare('SELECT page_json FROM physical_course_pages WHERE course_id=? LIMIT 1');
            $q->execute([$courseId]);
            $old=$q->fetchColumn();
            $original=(is_string($old)&&$old!=='')?$old:json_encode(['sections'=>$sections],JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES|JSON_THROW_ON_ERROR);
            $q=$pdo->prepare('INSERT INTO physical_course_pages(course_id,sections_json,page_json,updated_by) VALUES(?,?,?,?) ON DUPLICATE KEY UPDATE sections_json=VALUES(sections_json),updated_by=VALUES(updated_by),updated_at=NOW()');
            $q->execute([$courseId,$sectionsJson,$original,$adminId]);
        }else{
            $q=$pdo->prepare('INSERT INTO physical_course_pages(course_id,sections_json,updated_by) VALUES(?,?,?) ON DUPLICATE KEY UPDATE sections_json=VALUES(sections_json),updated_by=VALUES(updated_by),updated_at=NOW()');
            $q->execute([$courseId,$sectionsJson,$adminId]);
        }
        return;
    }
    // Legacy table: preserve title/description and other JSON page metadata.
    $q=$pdo->prepare('SELECT page_json FROM physical_course_pages WHERE course_id=? LIMIT 1');
    $q->execute([$courseId]);
    $old=$q->fetchColumn();
    $page=is_string($old)?json_decode($old,true):null;
    if(!is_array($page)||array_is_list($page))$page=[];
    $page['sections']=$sections;
    $q=$pdo->prepare('INSERT INTO physical_course_pages(course_id,page_json,updated_by) VALUES(?,?,?) ON DUPLICATE KEY UPDATE page_json=VALUES(page_json),updated_by=VALUES(updated_by),updated_at=NOW()');
    $q->execute([$courseId,json_encode($page,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES|JSON_THROW_ON_ERROR),$adminId]);
}
function physicalSeedOne(PDO $pdo): void {
    if((int)$pdo->query('SELECT COUNT(*) FROM physical_course_pages')->fetchColumn()>0)return;
    $courses=$pdo->query("SELECT * FROM courses WHERE status='published' ORDER BY id ASC")->fetchAll();
    foreach($courses as $course){
        if(!physicalModeEnabled($course))continue;
        physicalSave($pdo,(int)$course['id'],physicalSample(),null);
        break;
    }
}
function physicalBlockHash(array $block): string {
    return hash('sha256',json_encode([$block['type'],$block['title'],$block['text'],$block['choices'],$block['correct'],$block['questions']??[],$block['required']],JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES));
}
function physicalStudentState(PDO $pdo,int $studentId,int $courseId,array $sections): array {
    $stmt=$pdo->prepare('SELECT block_id,content_hash,answer_text,submitted_at FROM physical_course_submissions WHERE user_id=? AND course_id=?');
    $stmt->execute([$studentId,$courseId]);$saved=[];
    foreach($stmt->fetchAll(PDO::FETCH_ASSOC) as $row)$saved[$row['block_id']]=$row;
    $completions=[];$submitted=[];$firstLocked=null;
    foreach($sections as $section)foreach($section['blocks'] as $block)if(isset($saved[$block['id']]) && hash_equals(physicalBlockHash($block),(string)$saved[$block['id']]['content_hash']))$submitted[]=$block['id'];
    foreach($sections as $s)foreach($s['blocks'] as $b){
        if(empty($b['required']))continue;
        $valid=isset($saved[$b['id']]) && hash_equals(physicalBlockHash($b),(string)$saved[$b['id']]['content_hash']);
        if($valid)$completions[]=$b['id'];
        elseif($firstLocked===null)$firstLocked=$b['id'];
    }
    return ['completed'=>$completions,'submitted'=>$submitted,'first_incomplete'=>$firstLocked];
}
