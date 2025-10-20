var STORAGE_KEY = 'ufc_forum_posts_v1';

var state = { threads: [] };

function agoraISO() {
    var d = new Date();
    return d.toISOString();
}

function escaparHtml(s) {
    var t = String(s);
    t = t.replace(/&/g, '&amp;');
    t = t.replace(/</g, '&lt;');
    t = t.replace(/>/g, '&gt;');
    t = t.replace(/"/g, '&quot;');
    t = t.replace(/'/g, '&#39;');
    return t;
}

function tempoPassado(iso) {
    try {
        var d = new Date(iso);
        var diff = Date.now() - d.getTime();
        var mins = Math.floor(diff / 60000);
        if (mins < 60) return mins + 'm';
        var hrs = Math.floor(mins / 60);
        if (hrs < 24) return hrs + 'h';
        var days = Math.floor(hrs / 24);
        return days + 'd';
    } catch (e) { return ''; }
}

function salvarEstado() {
    try {
        var s = JSON.stringify(state);
        localStorage.setItem(STORAGE_KEY, s);
    } catch (e) { }
}

function carregarEstado() {
    try {
        var raw = localStorage.getItem(STORAGE_KEY);
        if (raw && raw.length > 0) {
            var parsed = JSON.parse(raw);
            if (parsed) state = parsed;
        } else {
            state = { threads: [] };
            salvarEstado();
        }
    } catch (e) {
        state = { threads: [] };
    }
}

function desenharThreads() {
    var tbody = document.querySelector('#threadsTable tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    if (!state.threads || state.threads.length === 0) {
        var tr = document.createElement('tr');
        var td = document.createElement('td');
        td.colSpan = 3;
        td.style.padding = '18px';
        td.textContent = 'Nenhum tópico ainda. Crie o primeiro!';
        tr.appendChild(td);
        tbody.appendChild(tr);
        return;
    }
    for (var i = state.threads.length - 1; i >= 0; i--) {
        var t = state.threads[i];
        var tr2 = document.createElement('tr');

        var tdTopic = document.createElement('td');
        tdTopic.className = 'topic';
        var a = document.createElement('a');
        a.href = '#';
        a.appendChild(document.createTextNode(t.title));
        a.setAttribute('data-id', t.id);
        (function(el) { el.onclick = function(ev) { if (ev && ev.preventDefault) ev.preventDefault(); var id = parseInt(this.getAttribute('data-id'), 10); abrirTopico(id); return false; }; })(a);
        var br = document.createElement('br');
        var span = document.createElement('span');
        span.className = 'author';
        span.appendChild(document.createTextNode('por ' + t.author));
        tdTopic.appendChild(a); tdTopic.appendChild(br); tdTopic.appendChild(span);

        var tdNum = document.createElement('td');
        tdNum.className = 'num';
        var repliesCount = 0;
        if (t.replies && t.replies.length) repliesCount = t.replies.length;
        tdNum.appendChild(document.createTextNode(repliesCount));

        var last = t.lastActivity || t.created;
        var tdLast = document.createElement('td');
        tdLast.className = 'last';
        tdLast.appendChild(document.createTextNode(tempoPassado(last)));

        tr2.appendChild(tdTopic); tr2.appendChild(tdNum); tr2.appendChild(tdLast);
        tbody.appendChild(tr2);
    }
}

function abrirTopico(id) {
    var t = null;
    for (var i = 0; i < state.threads.length; i++) { if (state.threads[i].id === id) { t = state.threads[i]; break; } }
    if (!t) { alert('Tópico não encontrado'); return; }
    fecharModal();
    var modal = document.createElement('div'); modal.id = 'threadModal'; modal.className = 'thread-modal';
    var inner = document.createElement('div'); inner.className = 'thread-modal-inner';
    var closeBtn = document.createElement('button'); closeBtn.className = 'modal-close'; closeBtn.appendChild(document.createTextNode('✕'));
    var title = document.createElement('h3'); title.appendChild(document.createTextNode(t.title));
    var meta = document.createElement('div'); meta.className = 'meta'; meta.appendChild(document.createTextNode('criado por ' + t.author + ' — ' + (new Date(t.created)).toLocaleString()));
    var repliesWrap = document.createElement('div'); repliesWrap.className = 'replies';
    if (t.replies && t.replies.length) {
        for (var j = 0; j < t.replies.length; j++) {
            var r = t.replies[j];
            var rdiv = document.createElement('div'); rdiv.className = 'reply';
            var strong2 = document.createElement('strong'); strong2.appendChild(document.createTextNode(escaparHtml(r.author)));
            rdiv.appendChild(strong2); rdiv.appendChild(document.createTextNode(': ' + escaparHtml(r.content)));
            var meta2 = document.createElement('span'); meta2.className = 'meta'; meta2.appendChild(document.createTextNode(' ' + (new Date(r.time)).toLocaleString())); rdiv.appendChild(meta2);
            repliesWrap.appendChild(rdiv);
        }
    }
    var form = document.createElement('form'); form.className = 'reply-form';
    var inputContent = document.createElement('input'); inputContent.id = 'replyContent'; inputContent.placeholder = 'Resposta'; inputContent.required = true;
    var btn = document.createElement('button'); btn.appendChild(document.createTextNode('Responder'));
    form.appendChild(inputContent); form.appendChild(btn);
    inner.appendChild(closeBtn); inner.appendChild(title); inner.appendChild(meta); inner.appendChild(repliesWrap); inner.appendChild(form); modal.appendChild(inner); document.body.appendChild(modal);
    closeBtn.onclick = function() { fecharModal(); };
    modal.onclick = function(e) { if (e.target === modal) fecharModal(); };
    form.onsubmit = function(e) { if (e && e.preventDefault) e.preventDefault(); var author = 'anon'; var content = inputContent.value || ''; if (!content) return false; if (!t.replies) t.replies = []; t.replies.push({ author: author, content: content, time: agoraISO() }); t.lastActivity = agoraISO(); salvarEstado(); desenharThreads(); var rdiv2 = document.createElement('div'); rdiv2.className = 'reply'; var s = document.createElement('strong'); s.appendChild(document.createTextNode(escaparHtml(author))); rdiv2.appendChild(s); rdiv2.appendChild(document.createTextNode(': ' + escaparHtml(content))); var m3 = document.createElement('span'); m3.className = 'meta'; m3.appendChild(document.createTextNode(' ' + (new Date()).toLocaleString())); rdiv2.appendChild(m3); repliesWrap.appendChild(rdiv2); if (form && form.reset) form.reset(); return false; };
}

function fecharModal() { var existing = document.getElementById('threadModal'); if (existing) { existing.parentNode.removeChild(existing); } }

function iniciar() {
    var newThreadForm = document.getElementById('newThreadForm');
    if (newThreadForm) {
        newThreadForm.onsubmit = function(evt) {
            if (evt && evt.preventDefault) evt.preventDefault();
            var titleEl = document.getElementById('threadTitle');
            var authorEl = document.getElementById('threadAuthor');
            var contentEl = document.getElementById('threadContent');
            var title = '';
            var author = '';
            var content = '';
            if (titleEl) title = titleEl.value.trim();
            if (authorEl) author = authorEl.value.trim();
            if (contentEl) content = contentEl.value.trim();
            if (!title) return false;
            if (!author) author = 'anon';
            var now = new Date();
            var id = now.getTime();
            var thread = { id: id, title: title, author: author, created: now.toISOString(), lastActivity: now.toISOString(), replies: [] };
            if (content) thread.replies.push({ author: author, content: content, time: now.toISOString() });
            state.threads.push(thread);
            salvarEstado();
            desenharThreads();
            if (newThreadForm && newThreadForm.reset) newThreadForm.reset();
            return false;
        };
    }
    // guestbook removed - no handlers
    desenharThreads();
}

window.onload = function() { carregarEstado(); iniciar(); };
