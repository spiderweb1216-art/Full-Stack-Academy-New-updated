/* Shared English/Hindi runtime. Keeps model values, URLs and form input untouched. */
(() => {'use strict';
  const defaults={
    'Home':'होम','Courses':'कोर्स','Batches':'बैच','Events':'इवेंट','Branches':'शाखाएँ',
    'About':'हमारे बारे में','Contact':'संपर्क','Sign In':'साइन इन','Login':'लॉग इन','Register':'रजिस्टर',
    'Search':'खोजें','Search Courses':'कोर्स खोजें','Search courses':'कोर्स खोजें','Open cart':'कार्ट खोलें',
    'Open menu':'मेन्यू खोलें','Close menu':'मेन्यू बंद करें','Get A Call':'कॉल का अनुरोध करें','Request a callback':'कॉल का अनुरोध करें',
    'Course Guidance':'कोर्स मार्गदर्शन','Full name':'पूरा नाम','Phone number':'फोन नंबर','Email address':'ईमेल पता',
    'Course interested':'पसंदीदा कोर्स','Learning mode':'सीखने का तरीका','Request My Call':'मुझे कॉल करें',
    'View All Courses':'सभी कोर्स देखें','View Course':'कोर्स देखें','View Details':'विवरण देखें','Learn More':'और जानें',
    'Upcoming Batches':'आने वाले बैच','Upcoming Batch':'आने वाला बैच','Live Streamed':'लाइव ऑनलाइन',
    'Recorded':'रिकॉर्डेड','Offline Classroom':'क्लासरूम','Start anytime':'कभी भी शुरू करें',
    'Add to Cart':'कार्ट में जोड़ें','Buy Now':'अभी खरीदें','Enroll Now':'अभी नामांकन करें','Apply Now':'अभी आवेदन करें',
    'Explore Courses':'कोर्स देखें','Browse Courses':'कोर्स खोजें','Course Categories':'कोर्स श्रेणियाँ',
    'Our Courses':'हमारे कोर्स','Popular Courses':'लोकप्रिय कोर्स','Featured Courses':'विशेष कोर्स',
    'Why Choose Us':'हमें क्यों चुनें','Student Reviews':'छात्र समीक्षाएँ','Frequently Asked Questions':'अक्सर पूछे जाने वाले प्रश्न',
    'Read More':'और पढ़ें','Show More':'और दिखाएँ','Show Less':'कम दिखाएँ','Back to top':'ऊपर वापस जाएँ',
    'Latest':'ताज़ा','Latest academy news':'अकादमी की ताज़ा खबरें','Upcoming batch':'आने वाला बैच',
    'Classroom batch':'क्लासरूम बैच','Hide course updates':'कोर्स अपडेट छिपाएँ','Hide updates':'अपडेट छिपाएँ',
    'Accessibility':'सुलभता','Accessibility options':'सुलभता विकल्प','Close accessibility options':'सुलभता विकल्प बंद करें',
    'Text size':'टेक्स्ट का आकार','Decrease text size':'टेक्स्ट छोटा करें','Increase text size':'टेक्स्ट बड़ा करें',
    'Website tools':'वेबसाइट टूल','High contrast':'उच्च कॉन्ट्रास्ट','Readable font':'पढ़ने योग्य फ़ॉन्ट','Highlight links':'लिंक हाइलाइट करें',
    'Reduce motion':'एनिमेशन कम करें','Reset settings':'सेटिंग रीसेट करें','Reset':'रीसेट','On':'चालू','Off':'बंद',
    'Language':'भाषा','English':'अंग्रेज़ी','Hindi':'हिन्दी','Privacy policy':'गोपनीयता नीति',
    'Accept all':'सभी स्वीकार करें','Necessary only':'केवल आवश्यक','Subscribe':'सब्सक्राइब करें','Your name':'आपका नाम',
    'Close':'बंद करें','Submit':'जमा करें','Send':'भेजें','Continue':'जारी रखें','Previous':'पिछला','Next':'अगला',
    'My Courses':'मेरे कोर्स','Wishlist':'पसंदीदा','Profile':'प्रोफ़ाइल','Logout':'लॉग आउट','Dashboard':'डैशबोर्ड',
    'Successfully Placed':'सफल छात्र','Available Candidates':'उपलब्ध उम्मीदवार','Academy Locations':'अकादमी स्थान',
    'All Courses':'सभी कोर्स','All Modes':'सभी तरीके','All Branches':'सभी शाखाएँ','All Locations':'सभी स्थान','All Times':'सभी समय','Clear Filters':'फ़िल्टर हटाएँ',
    'Time':'समय','Mode':'तरीका','Branch':'शाखा','Choose schedule':'समय चुनें','Choose batch time':'बैच का समय चुनें','Choose learning mode':'सीखने का तरीका चुनें','Choose location':'स्थान चुनें',
    'Morning':'सुबह','Afternoon':'दोपहर','Evening':'शाम','Start Anytime':'कभी भी शुरू करें','Online':'ऑनलाइन','Preferred language':'पसंदीदा भाषा','English / Hindi':'अंग्रेज़ी / हिन्दी',
    'No courses found':'कोई कोर्स नहीं मिला','Contact Us':'हमसे संपर्क करें','Call Us':'हमें कॉल करें','Email Us':'हमें ईमेल करें',
    'Message FSA AI Assistant':'FSA AI असिस्टेंट को संदेश भेजें','Send message':'संदेश भेजें','Close chat':'चैट बंद करें',
    'Start a new chat':'नई चैट शुरू करें','New chat':'नई चैट','Online now':'अभी ऑनलाइन','Demo mode':'डेमो मोड',
    'Ask about courses, batches, fees…':'कोर्स, बैच और फीस के बारे में पूछें…',
    'Search course, skill or technology...':'कोर्स, कौशल या तकनीक खोजें...',
    'Your name':'आपका नाम','View branches':'शाखाएँ देखें','Explore events':'इवेंट देखें','Talk to the team':'टीम से बात करें',
    'Which course is right for me?':'मेरे लिए कौन-सा कोर्स सही है?','Show upcoming batches':'आने वाले बैच दिखाएँ',
    'Online or classroom?':'ऑनलाइन या क्लासरूम?','What about course fees?':'कोर्स फीस कितनी है?',
    'Do you provide placement support?':'क्या आप प्लेसमेंट सहायता देते हैं?','Where are your branches?':'आपकी शाखाएँ कहाँ हैं?',
    'What events are coming up?':'कौन-से इवेंट आने वाले हैं?','How do I enroll?':'मैं नामांकन कैसे करूँ?',
    'Talk to admissions':'एडमिशन टीम से बात करें','You can also ask':'आप यह भी पूछ सकते हैं','Start with a question':'एक सवाल से शुरू करें',
    'How can I help you today?':'आज मैं आपकी कैसे मदद कर सकता हूँ?','Choose what you want help with, or type your own question below.':'जिस विषय में मदद चाहिए उसे चुनें, या नीचे अपना सवाल लिखें।',
    'Browse all courses':'सभी कोर्स देखें','View batches':'बैच देखें','Compare courses':'कोर्स की तुलना करें','See course prices':'कोर्स की फीस देखें',
    'Get fee details':'फीस की जानकारी लें','See alumni outcomes':'पूर्व छात्रों के परिणाम देखें','Contact FSA':'FSA से संपर्क करें',
    'Ask about an event':'इवेंट के बारे में पूछें','Choose a course':'कोर्स चुनें','Request a call':'कॉल का अनुरोध करें','Get a call':'कॉल प्राप्त करें','Contact page':'संपर्क पेज',
    'AI Specialist Live Streamed batch starts 07 Sep':'AI Specialist का लाइव ऑनलाइन बैच 07 सितम्बर से शुरू होगा',
    'AI-Powered Web Developer online enrollment is open':'AI-Powered Web Developer के ऑनलाइन नामांकन खुले हैं',
    'Data Science classroom batch at Tolichowki starts 21 Sep':'Tolichowki में Data Science क्लासरूम बैच 21 सितम्बर से शुरू होगा',
    'Recorded technology courses are available to start anytime':'रिकॉर्डेड टेक्नोलॉजी कोर्स कभी भी शुरू किए जा सकते हैं',
    'Upcoming academy events and workshops are now listed':'आने वाले अकादमी इवेंट और वर्कशॉप अब उपलब्ध हैं',
    'Admissions guidance is available at four Hyderabad branches':'हैदराबाद की चार शाखाओं में एडमिशन मार्गदर्शन उपलब्ध है',
    'Live Streamed batch starts 07 Sep':'लाइव ऑनलाइन बैच 07 सितम्बर से शुरू होगा','Online batch enrollment is open':'ऑनलाइन बैच के नामांकन खुले हैं',
    'Offline classroom seats are available':'ऑफलाइन क्लासरूम सीटें उपलब्ध हैं','Live Streamed evening batch enrolling':'लाइव ऑनलाइन शाम के बैच में नामांकन जारी है',
    'Instructor-led online batch enrolling':'प्रशिक्षक के साथ ऑनलाइन बैच में नामांकन जारी है','Recorded learning access is available':'रिकॉर्डेड लर्निंग उपलब्ध है',
    'Morning · 08:00 AM – 09:30 AM':'सुबह · 08:00 – 09:30','Starts 10 Sep · Afternoon':'10 सितम्बर से · दोपहर',
    'Tolichowki · Starts 21 Sep':'Tolichowki · 21 सितम्बर से','Starts 17 Sep · 07:30 PM':'17 सितम्बर से · शाम 07:30',
    'Starts 21 Sep · Afternoon':'21 सितम्बर से · दोपहर','Self-paced · Online':'अपनी गति से · ऑनलाइन',
    'Ask me anything about FSA':'FSA के बारे में कुछ भी पूछें','Try a quick question below, or type what you want to know about courses, batches, learning modes, branches, events or career support.':'नीचे कोई सवाल चुनें, या कोर्स, बैच, सीखने के तरीके, शाखाओं, इवेंट या करियर सहायता के बारे में अपना सवाल लिखें।',
    'Hi! I’m the FSA demo assistant 👋':'नमस्ते! मैं FSA डेमो असिस्टेंट हूँ 👋','I can help you explore courses, batches, learning modes, branches, events and career support. What would you like to know?':'मैं कोर्स, बैच, सीखने के तरीके, शाखाओं, इवेंट और करियर सहायता की जानकारी दे सकता हूँ। आप क्या जानना चाहेंगे?',
    'Let’s narrow down the right course':'सही कोर्स चुनते हैं','For a demo, I’d start with your goal: software development, data/analytics, cloud & DevOps, cyber security, or another technology track. The Courses page lets you compare the available programmes and learning modes.':'पहले अपना लक्ष्य चुनें: सॉफ्टवेयर डेवलपमेंट, डेटा और एनालिटिक्स, क्लाउड व DevOps, साइबर सुरक्षा या कोई अन्य टेक्नोलॉजी क्षेत्र। कोर्स पेज पर उपलब्ध प्रोग्राम और सीखने के तरीकों की तुलना करें।',
    'FSA supports different schedules and learning modes depending on the programme. Open the Batches page to filter current options by time and mode.':'FSA अलग-अलग प्रोग्राम के अनुसार विभिन्न समय और सीखने के तरीके देता है। समय और तरीके के अनुसार विकल्प देखने के लिए बैच पेज खोलें।',
    'Choose the learning mode that fits you':'अपने लिए सही सीखने का तरीका चुनें','Courses can be offered through Live Streamed, Recorded and Offline Classroom options. Availability varies by course and batch, so check the course details or current batch filters before enrolling.':'कोर्स लाइव ऑनलाइन, रिकॉर्डेड और ऑफलाइन क्लासरूम विकल्पों में उपलब्ध हो सकते हैं। नामांकन से पहले कोर्स विवरण और मौजूदा बैच फ़िल्टर देखें।',
    'Course fees & payment':'कोर्स फीस और भुगतान','Fees depend on the selected course and learning mode. The demo assistant does not invent a fee; use the course page for the displayed price or request a callback for the latest admission/payment details.':'फीस चुने गए कोर्स और सीखने के तरीके पर निर्भर करती है। सही कीमत के लिए कोर्स पेज देखें या नवीनतम एडमिशन और भुगतान जानकारी के लिए कॉल का अनुरोध करें।',
    'Career & placement support':'करियर और प्लेसमेंट सहायता','FSA’s learning experience is designed around practical skills and career preparation, including guidance such as projects, CV/interview readiness and placement-focused support. Placement is support, not a guaranteed job outcome.':'FSA का सीखने का अनुभव व्यावहारिक कौशल और करियर तैयारी पर आधारित है, जिसमें प्रोजेक्ट, CV, इंटरव्यू तैयारी और प्लेसमेंट सहायता शामिल है। प्लेसमेंट सहायता दी जाती है, नौकरी की गारंटी नहीं।',
    'Visit an FSA branch':'FSA शाखा पर जाएँ','You can explore the FSA branch locations and choose the most convenient centre. The website currently includes Tolichowki, Charminar, Ameerpet and Gachibowli branch pages.':'आप FSA शाखाओं के स्थान देखकर अपने लिए सुविधाजनक केंद्र चुन सकते हैं। वेबसाइट पर Tolichowki, Charminar, Ameerpet और Gachibowli शाखाएँ उपलब्ध हैं।',
    'FSA events & workshops':'FSA इवेंट और वर्कशॉप','The Events area lists academy workshops, talks, ceremonies, hackathons and other activities. Open it to browse event cards, filters, event details and the calendar.':'इवेंट क्षेत्र में अकादमी वर्कशॉप, वार्ता, समारोह, हैकाथॉन और अन्य गतिविधियाँ उपलब्ध हैं। इवेंट कार्ड, फ़िल्टर, विवरण और कैलेंडर देखने के लिए इसे खोलें।',
    'Ready to start?':'शुरू करने के लिए तैयार हैं?','Choose your course first, review the available mode and batch, then contact the academy for the latest enrollment steps. This demo assistant can route you to the right place.':'पहले कोर्स चुनें, उपलब्ध तरीका और बैच देखें, फिर नामांकन की नवीनतम प्रक्रिया के लिए अकादमी से संपर्क करें।',
    'Talk to the FSA team':'FSA टीम से बात करें','For admissions, fees, batch availability or a specific course question, the fastest next step is the website callback/contact flow.':'एडमिशन, फीस, बैच उपलब्धता या किसी कोर्स के सवाल के लिए वेबसाइट से कॉल का अनुरोध करना सबसे तेज़ तरीका है।',
    'I can help with that in demo mode':'मैं डेमो मोड में इसमें मदद कर सकता हूँ','This version is using smart preset replies rather than a live AI model. Ask me about courses, batches, fees, learning modes, branches, events, admissions or placement support. Later, the reply function can be connected directly to your AI backend.':'यह संस्करण लाइव AI मॉडल के बजाय तैयार जवाबों का उपयोग करता है। कोर्स, बैच, फीस, सीखने के तरीके, शाखाओं, इवेंट, एडमिशन या प्लेसमेंट सहायता के बारे में पूछें। बाद में इसे आपके AI बैकएंड से जोड़ा जा सकता है।'
  };
  Object.assign(defaults,{"Overview": "अवलोकन", "Website Content": "वेबसाइट सामग्री", "Companies": "कंपनियाँ", "Alumni": "पूर्व छात्र", "Job Seekers": "नौकरी के उम्मीदवार", "Students": "छात्र", "Instructors": "प्रशिक्षक", "Media Library": "मीडिया लाइब्रेरी", "Orders": "ऑर्डर", "Enrollments": "नामांकन", "Users": "उपयोगकर्ता", "Approvals": "स्वीकृतियाँ", "Enquiries": "पूछताछ", "Account": "खाता", "Save": "सहेजें", "Cancel": "रद्द करें", "Delete": "हटाएँ", "Edit": "संपादित करें", "Actions": "कार्रवाई", "Status": "स्थिति", "Name": "नाम", "Email": "ईमेल", "Phone": "फोन", "Password": "पासवर्ड", "Confirm Password": "पासवर्ड की पुष्टि करें", "Forgot Password?": "पासवर्ड भूल गए?", "Remember me": "मुझे याद रखें", "Settings": "सेटिंग", "Certificates": "प्रमाणपत्र", "Purchase History": "खरीद इतिहास", "Assignments": "असाइनमेंट", "Attendance": "उपस्थिति", "Resources": "संसाधन", "Lessons": "पाठ", "Modules": "मॉड्यूल", "Reports": "रिपोर्ट", "Payments": "भुगतान", "Total": "कुल", "Subtotal": "उप-कुल", "Discount": "छूट", "Checkout": "चेकआउट", "Cart": "कार्ट", "Remove": "हटाएँ", "Empty cart": "खाली कार्ट", "Continue Shopping": "खरीदारी जारी रखें", "Apply": "लागू करें", "Coupon code": "कूपन कोड", "Loading...": "लोड हो रहा है...", "No data found": "कोई जानकारी नहीं मिली", "Published": "प्रकाशित", "Draft": "प्रारूप", "Active": "सक्रिय", "Inactive": "निष्क्रिय", "Pending": "लंबित", "Approved": "स्वीकृत", "Rejected": "अस्वीकृत", "Completed": "पूर्ण", "Save Changes": "बदलाव सहेजें", "Save Website Content": "वेबसाइट सामग्री सहेजें", "Reload Saved Content": "सहेजी गई सामग्री फिर लोड करें", "View Website": "वेबसाइट देखें", "Content section": "सामग्री अनुभाग", "Translation Dictionary (Hindi)": "अनुवाद शब्दकोश (हिन्दी)", "Search current text or URL": "वर्तमान टेक्स्ट या URL खोजें", "Add field": "फ़ील्ड जोड़ें", "Exact current text / URL": "वर्तमान टेक्स्ट / URL", "Replacement": "प्रतिस्थापन", "Add a text or URL override": "टेक्स्ट या URL बदलाव जोड़ें", "Duration": "अवधि", "Hours": "घंटे", "Level": "स्तर", "Beginner": "शुरुआती", "Intermediate": "मध्यम", "Advanced": "उन्नत", "Price": "मूल्य", "Original price": "मूल मूल्य", "Description": "विवरण", "Short description": "संक्षिप्त विवरण", "Requirements": "आवश्यकताएँ", "Curriculum": "पाठ्यक्रम", "Reviews": "समीक्षाएँ", "All": "सभी", "Date": "तारीख", "Start date": "शुरुआत की तारीख", "End date": "समाप्ति की तारीख", "Location": "स्थान", "Seats": "सीटें", "Available seats": "उपलब्ध सीटें", "Address": "पता", "City": "शहर", "Country": "देश", "Upload": "अपलोड करें", "Upload image": "चित्र अपलोड करें", "Choose an Image": "चित्र चुनें", "Add Course": "कोर्स जोड़ें", "Add User": "उपयोगकर्ता जोड़ें", "Grant Course Access": "कोर्स की पहुँच दें", "Public Course Page": "सार्वजनिक कोर्स पेज", "Private Lessons": "निजी पाठ", "Save Private Lessons": "निजी पाठ सहेजें", "Course Details": "कोर्स विवरण", "Projects & Reviews": "प्रोजेक्ट और समीक्षाएँ", "Modules & Lessons": "मॉड्यूल और पाठ", "My Profile": "मेरी प्रोफ़ाइल", "Learning Progress": "सीखने की प्रगति", "Continue Learning": "सीखना जारी रखें", "Start Learning": "सीखना शुरू करें", "Download": "डाउनलोड करें", "View": "देखें", "Back": "वापस", "Next Lesson": "अगला पाठ", "Previous Lesson": "पिछला पाठ", "Mark as Complete": "पूर्ण चिह्नित करें", "Sign Out": "साइन आउट", "Privacy Policy": "गोपनीयता नीति", "Terms & Conditions": "नियम और शर्तें", "Refund Policy": "धनवापसी नीति", "Help": "सहायता", "Support": "सहायता", "Send Message": "संदेश भेजें", "Subject": "विषय", "Message": "संदेश", "Full Name": "पूरा नाम", "Email Address": "ईमेल पता", "Phone Number": "फोन नंबर"});

  const textStates=new WeakMap(),attributeStates=new WeakMap();
  const attributes=['placeholder','title','aria-label','alt'];
  const excluded='script,style,noscript,svg,code,pre,textarea,[data-no-translate],.fsa-language-switch,[contenteditable="true"],.leaflet-container';
  let language='en',custom={},queued=false;
  try{language=localStorage.getItem('fsa_language_v1')==='hi'?'hi':'en';}catch(_){}
  function lookup(source){const key=String(source).trim();return custom[key]??defaults[key]??null;}
  function convert(source){if(language!=='hi')return source;const replacement=lookup(source);return replacement==null?source:source.replace(source.trim(),String(replacement));}
  function state(node){const current=node.nodeValue,old=textStates.get(node);return old&&old.rendered===current?old.source:current;}
  function setSource(node,source){if(node.parentElement?.tagName==='OPTION'&&!node.parentElement.hasAttribute('value'))node.parentElement.setAttribute('value',node.parentElement.textContent);const rendered=convert(source);textStates.set(node,{source,rendered});if(node.nodeValue!==rendered)node.nodeValue=rendered;}
  function attributeSource(el,name){const current=el.getAttribute(name),old=attributeStates.get(el)?.[name];return old&&old.rendered===current?old.source:current;}
  function setAttributeSource(el,name,source){const rendered=convert(source),saved=attributeStates.get(el)||{};saved[name]={source,rendered};attributeStates.set(el,saved);if(el.getAttribute(name)!==rendered)el.setAttribute(name,rendered);}
  function apply(){queued=false;if(!document.body)return;
    document.documentElement.lang=language;document.documentElement.classList.toggle('fsa-lang-hi',language==='hi');
    const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let node;
    while((node=walker.nextNode()))if(node.parentElement&&!node.parentElement.closest(excluded))setSource(node,state(node));
    document.body.querySelectorAll('[placeholder],[title],[aria-label],[alt]').forEach(el=>{if(el.closest(excluded))return;attributes.forEach(name=>{if(el.hasAttribute(name))setAttributeSource(el,name,attributeSource(el,name));});});
    document.querySelectorAll('[data-fsa-language]').forEach(button=>{const active=button.dataset.fsaLanguage===language;button.classList.toggle('is-active',active);button.setAttribute('aria-pressed',String(active));});
  }
  function schedule(){if(!queued){queued=true;requestAnimationFrame(apply);}}
  function set(value,remember=true){language=value==='hi'?'hi':'en';if(remember)try{localStorage.setItem('fsa_language_v1',language);}catch(_){}apply();window.dispatchEvent(new CustomEvent('fsa-language-change',{detail:{language}}));}
  function setDictionary(content){custom=content?.translations?.hi||{};schedule();}
  function missing(){const found=new Set(),walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let node;while((node=walker.nextNode())){if(!node.parentElement||node.parentElement.closest(excluded))continue;const source=state(node).trim();if(/[A-Za-z]{2}/.test(source)&&!lookup(source))found.add(source);}return [...found];}
  window.FSA_LANGUAGE={set,apply,schedule,setDictionary,source:state,setSource,attributeSource,setAttributeSource,missing,get:()=>language};
  document.addEventListener('click',event=>{const button=event.target.closest('[data-fsa-language]');if(button)set(button.dataset.fsaLanguage);});
  window.addEventListener('storage',event=>{if(event.key==='fsa_language_v1')set(event.newValue,false);});
  document.addEventListener('fsa:content-updated',()=>setDictionary(window.FSA_CONTENT?.get()));
  function init(){
    if(/\/admin\//.test(location.pathname)){
      const header=document.querySelector('.topbar');if(header&&!header.querySelector('.fsa-language-switch')){const group=document.createElement('div');group.className='fsa-language-switch';group.dataset.noTranslate='';group.setAttribute('role','group');group.setAttribute('aria-label','Language');group.innerHTML='<button type="button" class="secondary-button" data-fsa-language="en">EN</button> <button type="button" class="secondary-button" data-fsa-language="hi" lang="hi">हिन्दी</button>';header.append(group);}
      fetch('../api/index.php?action=public_content',{credentials:'same-origin'}).then(r=>r.json()).then(result=>setDictionary(result.content||result.data?.content||{})).catch(()=>{});
    }
    new MutationObserver(records=>{if(records.some(r=>r.type==='childList'||r.type==='characterData'||attributes.includes(r.attributeName)))schedule();}).observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:attributes});
    apply();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
