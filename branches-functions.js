  // Branches administration: these functions were missing from LMS v5.1.
  async function renderBranchesAdmin(){
    const result=await api('admin_branches');
    state.branches=Array.isArray(result.branches)?result.branches:[];
    const canEdit=isCentralRole();
    const addAction=canEdit?'<button class="primary-button" type="button" data-action="add-branch">+ Add Branch</button>':'';
    content.innerHTML=`${pageHead('Branch Management',canEdit?'Manage academy locations, contact details, photography and the public branch pages.':'View branch information available to your account.',addAction)}
      <div class="toolbar"><div class="toolbar-group"><span class="form-hint">${state.branches.length} branch${state.branches.length===1?'':'es'} in your access scope</span></div></div>
      <div class="table-wrap">${state.branches.length?`<table class="data-table"><thead><tr><th>Branch</th><th>Location & Contact</th><th>Opening hours</th><th>Status</th><th>Actions</th></tr></thead><tbody>${state.branches.map(branch=>{
        const id=Number(branch.dbId)||0;
        const slug=String(branch.slug||'');
        const url=`../branches/view/index.html?branch=${encodeURIComponent(slug)}`;
        const preview=branch.image||branch.heroImage||'';
        const image=preview?`<img src="${esc(mediaUrl(preview))}" alt="" style="width:48px;height:48px;object-fit:cover;border-radius:10px">`:esc(initials(branch.shortName||branch.name||'FS'));
        const editButtons=canEdit?`<button type="button" data-action="edit-branch" data-id="${id}">Edit</button><button type="button" data-action="delete-branch" data-id="${id}">Delete</button>`:'';
        return `<tr><td><div class="user-cell"><span>${image}</span><div><strong>${esc(branch.name||branch.shortName||'Unnamed branch')}</strong><small>${esc(slug)}</small></div></div></td><td>${esc(branch.location||branch.address||'—')}<br><small>${esc(branch.phone||branch.email||'')}</small></td><td>${esc(branch.hours||'—')}</td><td><span class="${statusClass(branch.status)}">${esc(branch.status||'published')}</span></td><td><div class="row-actions"><a href="${esc(url)}" target="_blank" rel="noopener">View</a>${editButtons}</div></td></tr>`;
      }).join('')}</tbody></table>`:emptyState('No branches found',canEdit?'Add your first branch to publish an academy location.':'No branches are assigned to your account.')}</div>`;
  }

  function openBranchEditor(branch={}){
    if(!isCentralRole()){
      toast('You do not have permission to edit branches.','error');
      return;
    }
    const b={status:'published',sortOrder:state.branches.length+1,...branch};
    const existing=Number(b.dbId)||0;
    content.innerHTML=`${pageHead(existing?'Edit Branch':'Add Branch','Update a location and its public branch page. Changes are saved to MySQL.')}
      <section class="settings-card easy-editor-card"><form id="branchForm" class="settings-form easy-editor-form">
        <input type="hidden" name="dbId" value="${existing||''}">
        <label>Branch name<input name="name" required maxlength="190" value="${esc(b.name||'')}" placeholder="FSA — Charminar"></label>
        <label>Short name<input name="shortName" maxlength="120" value="${esc(b.shortName||'')}" placeholder="Charminar"></label>
        <label>URL slug<input name="slug" maxlength="120" value="${esc(b.slug||'')}" placeholder="charminar (automatically created if empty)"></label>
        <label>Area / location<input name="location" maxlength="190" value="${esc(b.location||'')}" placeholder="Charminar, Hyderabad"></label>
        <label class="full">Full address<input name="address" maxlength="500" value="${esc(b.address||'')}" placeholder="Street address and city"></label>
        <label>Phone number<input name="phone" maxlength="60" value="${esc(b.phone||'')}"></label>
        <label>Extension<input name="extension" maxlength="80" value="${esc(b.extension||'')}"></label>
        <label>Email<input name="email" type="email" maxlength="190" value="${esc(b.email||'')}"></label>
        <label>Opening hours<input name="hours" maxlength="190" value="${esc(b.hours||'')}" placeholder="Mon–Sat · 9 AM–8 PM"></label>
        <label class="full">Description<textarea name="description" maxlength="5000" rows="5">${esc(b.description||'')}</textarea></label>
        ${easyImageField('Branch listing image','image',b.image||'','Photo shown in the branches listing.')}
        ${easyImageField('Branch page hero image','heroImage',b.heroImage||'','Large image shown on the branch detail page.')}
        ${easyDetails('Gallery & display options','Optional gallery, map coordinates and publishing controls.',`
          <div class="settings-form easy-inner-grid">
            <label class="full">Gallery image URLs (one per line)<textarea name="gallery" rows="5" placeholder="assets/images/branch-detail/example/gallery-1.jpg">${esc(toLines(b.gallery))}</textarea></label>
            <label>Latitude<input name="lat" type="number" step="any" min="-90" max="90" value="${b.lat===null||b.lat===undefined?'':esc(b.lat)}"></label>
            <label>Longitude<input name="lng" type="number" step="any" min="-180" max="180" value="${b.lng===null||b.lng===undefined?'':esc(b.lng)}"></label>
            <label>Sort order<input name="sortOrder" type="number" value="${Number(b.sortOrder)||0}"></label>
            <label>Status<select name="status"><option value="published" ${b.status!=='draft'?'selected':''}>Published</option><option value="draft" ${b.status==='draft'?'selected':''}>Draft</option></select></label>
          </div>`)}
        <div class="form-actions full"><button class="secondary-button" type="button" data-view="branches">Cancel</button><button class="primary-button" type="submit">${existing?'Save Changes':'Create Branch'}</button></div>
      </form></section>`;
  }

