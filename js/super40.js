(function () {
  'use strict';

  const list = items => `<ul>${items.map(x => `<li>${x}</li>`).join('')}</ul>`;
  const chips = items => `<div class="s40-chip-list">${items.map(x => `<span>${x}</span>`).join('')}</div>`;

  function render(app) {
    const {semesters,chapters,tracks,why,outcomes,practical,highlights,programFeatures,admissionSteps,admissionDocs,feeRows,admissionScholarships,performanceScholarships,leadership,programMeta}=window.FSA_DATA?.content?.super40||{};
    if(!semesters){app.innerHTML="";return;}
    app.innerHTML = `
      <div class="s40-page">
        <section class="s40-hero">
          <div class="container s40-hero-grid">
            <div class="s40-hero-copy reveal">
              <span class="s40-kicker">Full Stack Academy Degree Program</span>
              <h1>SUPER40 <em>BBA</em></h1>
              <p>Three years of business education integrated with leadership training, AI skills, internships and preparation for future-ready careers.</p>
              <div class="s40-hero-meta"><span><b>${programMeta.durationMonths}</b><small>Months</small></span><span><b>${programMeta.rating}</b><small>Rating</small></span><span><b>${programMeta.seats}</b><small>Students</small></span></div>
              <div class="s40-actions"><button class="button button-primary button-lg" type="button" data-action="open-call-popup">Apply / Book Now</button><a class="button button-secondary button-lg" href="#/contact">Request Program Brochure</a></div>
              <div class="s40-admission-contact"><strong>Industry Integrated BBA Program · Affiliated to Osmania University</strong><span>Gachibowli, Hyderabad · Admissions: 8019 85 8811 / 8019 85 8833 · info@fullstackacademy.in</span></div>
            </div>
            <div class="s40-hero-media reveal reveal-delay-2">
              <img src="assets/images/fsa-home/slider-bba-wide.webp" alt="SUPER40 BBA 3 Year BBA Degree Program" loading="eager">
              <span class="s40-hero-badge"><b>Future Business Leaders</b><small>Degree + Technology + Internship + Placement</small></span>
            </div>
          </div>
        </section>

        <section class="s40-section s40-why">
          <div class="container">
            <div class="s40-heading reveal"><span>Why SUPER40 BBA?</span><h2>A degree designed around the <em>real graduate gap</em></h2><p>A degree alone is no longer enough. SUPER40 adds technology, leadership, practical exposure and career readiness to core business education.</p></div>
            <div class="s40-why-grid">${why.map((x,i)=>`<article class="s40-why-card reveal reveal-delay-${Math.min(i,3)}"><b>${x[0]}</b><h3>${x[1]}</h3><p>${x[2]}</p></article>`).join('')}</div>
          </div>
        </section>

        <section class="s40-section s40-model-section">
          <div class="container">
            <div class="s40-model reveal">
              <div><span>Our Approach</span><h2>3-Layer Industry Integrated Learning Model</h2><p>SUPER40 is structured to move students from degree seekers to future business leaders through academic foundations, employability development and technology specialization.</p></div>
              <div class="s40-model-flow"><span><b>01</b>BBA</span><i>→</i><span><b>02</b>Employability Skills</span><i>→</i><span><b>03</b>Technology Tracks</span></div>
            </div>
          </div>
        </section>

        <section class="s40-section">
          <div class="container">
            <div class="s40-heading reveal"><span>3-Layer Development Framework</span><h2>SUPER40 BBA <em>Learning Layers</em></h2><p>Academic excellence, leadership and future skills, followed by a practical technology specialization.</p></div>

            <article class="s40-layer s40-layer-one reveal">
              <div class="s40-layer-head"><span class="s40-layer-number">01</span><div><small>Layer 1</small><h3>BBA Curriculum Track</h3><p><strong>Academic Excellence Foundation.</strong> Complete a university-recognized BBA degree while developing strong business fundamentals.</p></div></div>
              <div class="s40-layer-grid">
                <div><h4>Core Areas</h4>${chips(['Business & Management','Finance & Economics','Marketing & Operations','Entrepreneurship'])}</div>
                <div><h4>Outcome of Layer 1</h4>${chips(['Business Knowledge','Management Concepts','Financial Understanding','Marketing Fundamentals','Entrepreneurial Thinking'])}</div>
              </div>
              <div class="s40-subheading"><span>Semester Overview</span><h3>BBA Curriculum — All 6 Semesters</h3></div>
              <div class="s40-semesters">${semesters.map((s,i)=>`<details class="s40-details" ${i===0?'open':''}><summary><span><b>0${i+1}</b>${s[0]}</span><i>+</i></summary><div class="s40-details-body">${list(s[1])}</div></details>`).join('')}</div>
              <p class="s40-note"><strong>Dual specialization:</strong> combinations are offered across Marketing, Human Resources and Finance.</p>
            </article>

            <article class="s40-layer reveal">
              <div class="s40-layer-head"><span class="s40-layer-number">02</span><div><small>Layer 2</small><h3>Leadership, Communication & Future Skills Framework</h3><p><strong>21st Century Employability Skills Program.</strong> Develop confidence, communication, leadership, problem solving, digital professionalism, AI-era workplace readiness and interview confidence.</p></div></div>
              <div class="s40-chapters">${chapters.map((c,i)=>`<details class="s40-chapter" ${i===0?'open':''}><summary><span class="s40-chapter-code">${c.id}</span><span><b>${c.title}</b><small>${c.intro}</small></span><i>+</i></summary><div class="s40-chapter-body"><div class="s40-module-grid">${c.groups.map(g=>`<div class="s40-module"><h4>${g[0]}</h4>${list(g[1])}</div>`).join('')}</div><div class="s40-outcomes"><strong>${c.id} Outcome</strong>${chips(c.outcomes)}</div></div></details>`).join('')}</div>
            </article>

            <article class="s40-layer reveal">
              <div class="s40-layer-head"><span class="s40-layer-number">03</span><div><small>Layer 3</small><h3>SUPER40 BBA Technology Tracks</h3><p><strong>Technology Specialization for the AI Era.</strong> Build business and technology capability through analytics, AI tools, digital business, marketing and growth tracks.</p></div></div>
              <div class="s40-track-grid">${tracks.map((t,i)=>`<article class="s40-track-card"><span>${t.badge}</span><h4>${t.title}</h4><p>${t.text}</p><div class="s40-track-block"><b>Technologies Covered</b>${chips(t.tech)}</div><div class="s40-track-block"><b>Career Opportunities</b>${list(t.careers)}</div></article>`).join('')}</div>
            </article>
          </div>
        </section>

        <section class="s40-section s40-surface">
          <div class="container">
            <div class="s40-heading reveal"><span>The SUPER40 Outcome</span><h2>What every student is built to <em>graduate with</em></h2><p>The program combines degree completion with practical skills, projects, career assets and workplace readiness.</p></div>
            <div class="s40-outcome-grid">${outcomes.map((x,i)=>`<div class="s40-outcome-card reveal reveal-delay-${i%4}"><b>${String(i+1).padStart(2,'0')}</b><span>${x}</span></div>`).join('')}</div>
          </div>
        </section>

        <section class="s40-section">
          <div class="container">
            <div class="s40-heading reveal"><span>Practical Learning Experience</span><h2>Learn like you work in a <em>company</em></h2><p>Practical exposure starts early through business projects, innovation challenges, internships and portfolio development.</p></div>
            <div class="s40-practical-grid">${practical.map((x,i)=>`<article class="s40-practical-card reveal reveal-delay-${i}"><span>0${i+1}</span><h3>${x[0]}</h3>${list(x[1])}</article>`).join('')}</div>
            <div class="s40-feature-strip reveal">${programFeatures.map(x=>`<span>✓ ${x}</span>`).join('')}</div>
          </div>
        </section>

        <section class="s40-section s40-highlights-section">
          <div class="container">
            <div class="s40-heading reveal"><span>Program Highlights</span><h2>Why students choose <em>SUPER40</em></h2></div>
            <div class="s40-highlights">${highlights.map((x,i)=>`<article class="reveal reveal-delay-${i%4}"><b>${String(i+1).padStart(2,'0')}</b><h3>${x[0]}</h3><p>${x[1]}</p></article>`).join('')}</div>
          </div>
        </section>

        <section class="s40-section s40-admission-section">
          <div class="container">
            <div class="s40-heading reveal"><span>Admission</span><h2>SUPER40 BBA <em>admission process</em></h2><p>Provisional admission is completed by submitting the application, required documents and applicable program fees.</p></div>
            <div class="s40-admission-flow reveal">${admissionSteps.map((x,i)=>`<span><b>${i+1}</b>${x}</span>${i<admissionSteps.length-1?'<i>→</i>':''}`).join('')}</div>
            <div class="s40-admission-grid">
              <article class="s40-admission-card reveal"><span>Required Documents</span><h3>Admission Documents</h3>${list(admissionDocs)}</article>
              <article class="s40-admission-card reveal reveal-delay-2"><span>Selection Philosophy</span><h3>Future Business Leader Focus</h3><p>SUPER40 is positioned as a selective cohort rather than a mass-enrolment degree program, with assessment, counseling and scholarship evaluation included in the admission journey.</p><button class="button button-primary" type="button" data-action="open-call-popup">Start Admission Enquiry</button></article>
            </div>
          </div>
        </section>

        <section class="s40-section s40-surface">
          <div class="container">
            <div class="s40-heading reveal"><span>Official Brochure Details</span><h2>Fee schedule & <em>scholarships</em></h2><p>These figures reproduce the fee and scholarship data published in the currently linked SUPER40 brochure. Verify dates before final publication if the academy revises the schedule.</p></div>
            <div class="s40-table-card reveal"><div class="s40-table-title"><h3>SUPER40 BBA Fee Schedule</h3><strong>Total Program Fee: ${programMeta.totalFee}</strong></div><div class="s40-table-wrap"><table><thead><tr><th>Particular</th><th>Due Date</th><th>Amount</th></tr></thead><tbody>${feeRows.map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join('')}</tbody></table></div><p class="s40-note">A refundable caution deposit of ${programMeta.cautionDeposit} is payable with the first instalment. University examination fees are separate; fees are subject to revision.</p></div>
            <div class="s40-scholarship-grid">
              <article class="s40-table-card reveal"><div class="s40-table-title"><h3>Merit Scholarship — Admission</h3></div><div class="s40-table-wrap"><table><thead><tr><th>Class XII Aggregate</th><th>Per Semester</th><th>6-Semester Total</th></tr></thead><tbody>${admissionScholarships.map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join('')}</tbody></table></div></article>
              <article class="s40-table-card reveal reveal-delay-2"><div class="s40-table-title"><h3>Semester-Wise Performance Scholarship</h3></div><div class="s40-table-wrap"><table><thead><tr><th>Academic Performance</th><th>Scholarship</th></tr></thead><tbody>${performanceScholarships.map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`).join('')}</tbody></table></div><p class="s40-note"><strong>Early Bird Offer:</strong> ${programMeta.earlyBirdOffer}</p></article>
            </div>
          </div>
        </section>

        <section class="s40-section">
          <div class="container">
            <div class="s40-heading reveal"><span>Leadership</span><h2>Meet the program <em>leadership network</em></h2><p>The brochure states that the leadership team brings 50+ years of combined IT experience, including senior experience connected with companies such as Microsoft and Tech Mahindra, supported by an advisory network across consulting, AI and career transformation.</p></div>
            <div class="s40-leadership-grid">${leadership.map((x,i)=>`<article class="s40-leader reveal reveal-delay-${i%4}"><span>${x[0]}</span><h3>${x[1]}</h3><p>${x[2]}</p></article>`).join('')}</div>
          </div>
        </section>

        <section class="s40-final">
          <div class="container"><div class="s40-final-box reveal"><div><span>SUPER40 BBA Admissions</span><h2>Not just a degree — build a leadership journey.</h2><p>Explore the official brochure or submit the admission enquiry to discuss eligibility, scholarships, fees and the next cohort.</p></div><div><button class="button button-primary button-lg" type="button" data-action="open-call-popup">Apply Now</button><a class="button button-secondary button-lg" href="#/contact">Talk To FSA</a></div></div></div>
        </section>
      </div>`;
  }

  window.FSA_SUPER40_PAGE = { render };
})();
