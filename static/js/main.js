document.addEventListener('DOMContentLoaded', () => {

    // --- ESTADO DA APLICAÇÃO ---
    let hosts = [];
    let hostsToUpdate = [];
    let config = {};
    let editingIndex = null;
    let editingUpdateIndex = null;

    // --- INICIALIZAÇÃO DOS MODAIS ---
    const hostModal = new bootstrap.Modal(document.getElementById('hostModal'));
    const importTxtModal = new bootstrap.Modal(document.getElementById('importTxtModal'));
    const massEditModal = new bootstrap.Modal(document.getElementById('massEditModal'));

    // --- SELETORES DO DOM ---
    const apiUrlInput = document.getElementById('apiUrl');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const protocolSelector = document.getElementById('protocolSelector');
    const dynamicField = document.getElementById('dynamicField');
    const dynamicFieldLabel = document.getElementById('dynamicFieldLabel');
    const addHostBtn = document.getElementById('addHostBtn');
    const createTxtBtn = document.getElementById('createTxtBtn');
    const updateTxtBtn = document.getElementById('updateTxtBtn');
    const hostTableBody = document.getElementById('hostTableBody');
    const tablePlaceholder = document.getElementById('table-placeholder');
    const clearAllBtn = document.getElementById('clearAllBtn');
    const importToZabbixBtn = document.getElementById('importToZabbixBtn');
    const editMassBtn = document.getElementById('editMassBtn');
    const selectAllCheckbox = document.getElementById('selectAllCheckbox');
    const hostForm = document.getElementById('hostForm');
    const hostModalLabel = document.getElementById('hostModalLabel');
    const saveHostBtn = document.getElementById('saveHostBtn');
    const importTxtForm = document.getElementById('importTxtForm');
    const importTxtModalLabel = document.getElementById('importTxtModalLabel');
    const formatHint = document.getElementById('formatHint');
    const txtFile = document.getElementById('txtFile');
    const processTxtBtn = document.getElementById('processTxtBtn');
    const massEditForm = document.getElementById('massEditForm');
    const saveMassEditBtn = document.getElementById('saveMassEditBtn');
    const logOutput = document.getElementById('logOutput');
    const statusLight = document.getElementById('status-light');

    // ===================================================================
    //  FUNÇÕES DE LÓGICA E UI
    // ===================================================================

    function updateLog(message, level = 'INFO') {
        const timestamp = new Date().toLocaleString('pt-BR');
        const levelColor = { INFO: 'black', SUCCESS: 'green', ERROR: 'red', WARN: 'orange' };
        logOutput.innerHTML += `<span style="color:${levelColor[level] || 'black'}">[${timestamp}] [${level}] ${message}\n</span>`;
        logOutput.scrollTop = logOutput.scrollHeight;
    }

    function renderTable() {
        hostTableBody.innerHTML = '';
        const showPlaceholder = hosts.length === 0;
        tablePlaceholder.style.display = showPlaceholder ? 'block' : 'none';
        document.querySelectorAll('#importToZabbixBtn, #clearAllBtn, #editMassBtn').forEach(btn => btn.disabled = showPlaceholder);

        hosts.forEach((host, index) => {
            const row = hostTableBody.insertRow();
            row.setAttribute('data-index', index);
            row.innerHTML = `<td class="text-center"><input class="form-check-input host-checkbox" type="checkbox" value="${index}"></td><td>${host.visible_name}</td><td>${host.hostname}</td><td>${host.protocol === 'URL' ? host.url_type : (host.ip || '')}</td><td>${Array.isArray(host.hostgroup_ids) ? host.hostgroup_ids.join('-') : ''}</td><td>${Array.isArray(host.template_ids) ? host.template_ids.join('-') : ''}</td><td><small>${host.tags || ''}</small></td><td class="text-nowrap"><button class="btn btn-sm btn-outline-primary btn-edit me-1" title="Editar Host"><i class="bi bi-pencil"></i></button><button class="btn btn-sm btn-outline-danger btn-delete" title="Excluir Host"><i class="bi bi-trash"></i></button></td>`;
        });
        updateMassEditControls();
    }

    function renderUpdateTable() {
        const updateTableBody = document.getElementById('updateTableBody');
        updateTableBody.innerHTML = '';
        hostsToUpdate.forEach((host, index) => {
            updateTableBody.innerHTML += `
                <tr data-index="${index}">
                    <td>${host.visible_name || ''}</td>
                    <td>${host.hostname}</td>
                    <td>${host.hostgroup_ids ? host.hostgroup_ids.join('-') : ''}</td>
                    <td>${host.template_ids ? host.template_ids.join('-') : ''}</td>
                    <td>${host.tags || ''}</td>
                    <td>${host.second_interface ? `${host.second_interface.ip || ''}:${host.second_interface.port || ''}` : ''}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary btn-edit-update" title="Editar"><i class="bi bi-pencil"></i></button>
                        <button class="btn btn-sm btn-outline-danger btn-delete-update" title="Excluir"><i class="bi bi-trash"></i></button>
                    </td>
                </tr>
            `;
        });
    }

    function updateProtocolOptions() {
        const selectedProtocol = protocolSelector.value;
        dynamicField.innerHTML = '';
        const isDefault = selectedProtocol === 'Default';
        document.querySelectorAll('#addHostBtn, #createTxtBtn, #updateTxtBtn').forEach(btn => btn.disabled = isDefault);
        dynamicField.style.display = 'block';
        dynamicFieldLabel.style.display = 'block';

        if (isDefault || selectedProtocol === 'ICMP' || selectedProtocol === 'Agent') {
            dynamicField.style.display = 'none';
            dynamicFieldLabel.style.display = 'none';
            return;
        }
        if (!config || Object.keys(config).length === 0) return;

        if (selectedProtocol === 'URL') {
            dynamicFieldLabel.textContent = 'Tipo de Monitoramento';
            dynamicField.add(new Option('Selecione um tipo...', ''));
            if (config.urlMonitoringTypes) Object.keys(config.urlMonitoringTypes).forEach(type => dynamicField.add(new Option(type, type)));
        } else {
            dynamicFieldLabel.textContent = 'Opções do Protocolo';
            let options = (selectedProtocol === 'SNMPv2') ? config.snmpv2Communities : config.snmpv3Users;
            if (options && options.length > 0) options.forEach(opt => dynamicField.add(new Option(opt, opt)));
            else dynamicField.add(new Option('Nenhuma opção disponível', ''));
        }
    }

    function updateMassEditControls() {
        const selectedCheckboxes = document.querySelectorAll('.host-checkbox:checked');
        const allCheckboxes = document.querySelectorAll('.host-checkbox');
        editMassBtn.disabled = selectedCheckboxes.length === 0;
        if (allCheckboxes.length > 0) {
            selectAllCheckbox.checked = selectedCheckboxes.length === allCheckboxes.length;
            selectAllCheckbox.indeterminate = selectedCheckboxes.length > 0 && selectedCheckboxes.length < allCheckboxes.length;
        } else {
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = false;
        }
    }

    function openHostModal(index = null) {
        editingIndex = index;
        editingUpdateIndex = null;
        const isEditing = index !== null;
        const hostData = isEditing ? hosts[index] : null;
        const protocol = isEditing ? hostData.protocol : protocolSelector.value;
        const urlType = isEditing ? hostData.url_type : dynamicField.value;

        if (protocol === 'URL' && !urlType) { alert('Selecione um Tipo de Monitoramento para a URL.'); return; }

        hostModalLabel.textContent = isEditing ? `Editar Host: ${hostData.hostname}` : `Adicionar Host - ${protocol === 'URL' ? urlType : protocol}`;
        hostForm.innerHTML = '';
        if (protocol === 'URL') buildUrlForm(urlType, hostData);
        else buildStandardForm(protocol, hostData);
        hostModal.show();
    }

    function openUpdateHostModal(index) {
        editingIndex = null;
        editingUpdateIndex = index;
        const hostData = hostsToUpdate[index];
        hostModalLabel.textContent = `Editar Host para Atualização: ${hostData.hostname}`;
        hostForm.innerHTML = '';
        buildStandardForm(hostData.protocol || 'Agent', hostData);
        hostModal.show();
    }

    function buildStandardForm(protocol, data = null) {
        const isEditing = data !== null;
        let formHtml = `
            <input type="hidden" name="protocol" value="${protocol}">
            <input type="hidden" name="protocol_option" value="${isEditing ? (data.protocol_option || '') : (protocol.startsWith('SNMP') ? dynamicField.value : '')}">
            <div class="mb-3">
                <label class="form-label">Hostname</label>
                <input type="text" class="form-control" name="hostname" value="${isEditing ? data.hostname : ''}" required ${isEditing ? 'readonly' : ''}>
            </div>
            <div class="mb-3">
                <label class="form-label">IP Principal</label>
                <input type="text" class="form-control" name="ip" value="${isEditing ? data.ip : ''}" required>
            </div>
        `;
        if (protocol === 'Agent') {
            formHtml += `<div class="mb-3"><label class="form-label">Porta do Agente</label><input type="number" class="form-control" name="port" value="${isEditing ? (data.port || '10050') : '10050'}"></div>`;
        }
        formHtml += `
            <div class="mb-3">
                <label class="form-label">Hostgroup IDs</label>
                <input type="text" class="form-control" name="hostgroup_ids" value="${isEditing && data.hostgroup_ids ? data.hostgroup_ids.join('-') : ''}" required>
            </div>
            <div class="mb-3">
                <label class="form-label">Template IDs</label>
                <input type="text" class="form-control" name="template_ids" value="${isEditing && data.template_ids ? data.template_ids.join('-') : ''}" required>
            </div>
            <div class="mb-3">
                <label class="form-label">Tags</label>
                <input type="text" class="form-control" name="tags" value="${isEditing ? data.tags : 'EQUIPMENT:VIRTUAL_SERVER'}">
            </div>
        `;

        if (isEditing) {
            formHtml += `
                <hr>
                <p class="small text-muted">Abaixo você pode editar os dados da segunda interface.</p>
                <div id="secondInterfaceFields">
                    <div class="mb-3">
                        <label class="form-label">IP da 2ª Interface</label>
                        <input type="text" class="form-control" name="ip2" value="${data.second_interface ? data.second_interface.ip : ''}">
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Porta da 2ª Interface</label>
                        <input type="text" class="form-control" name="port2" value="${data.second_interface ? data.second_interface.port : ''}">
                    </div>
                </div>
            `;
        }

        hostForm.innerHTML = formHtml;
    }

    function buildUrlForm(urlType, data = null) {
        const isEditing = data !== null;
        const urlConfig = config.urlMonitoringTypes[urlType];
        let macroFields = urlConfig.macros.map(macroName => {
            let macroValue = '';
            if (isEditing && data.macros) {
                const macro = data.macros.find(m => m.macro === macroName);
                if (macro) macroValue = macro.value;
            }
            return `<div class="mb-2"><label class="form-label">${macroName}</label><input type="text" class="form-control" name="macro_${macroName}" id="macro_${macroName}" value="${macroValue}"></div>`;
        }).join('');
        hostForm.innerHTML = `<input type="hidden" name="protocol" value="URL"><input type="hidden" name="url_type" value="${urlType}"><div class="mb-3"><label class="form-label">Hostname (Domínio)</label><input type="text" class="form-control" name="hostname" id="urlHostname" value="${isEditing ? data.hostname : ''}" required></div><div class="mb-3"><label class="form-label">Hostgroup IDs</label><input type="text" class="form-control" name="hostgroup_ids" value="${isEditing ? data.hostgroup_ids.join('-') : ''}" required></div><div class="mb-3"><label class="form-label">Tags</label><input type="text" class="form-control" name="tags" value="${isEditing ? data.tags : (urlConfig.default_tag || '')}"></div><hr><h6>Macros Específicas</h6>${macroFields}`;
        const urlHostnameInput = document.getElementById('urlHostname');
        if (urlHostnameInput && !isEditing) {
            urlHostnameInput.addEventListener('input', () => {
                const domain = urlHostnameInput.value;
                const macroHostUrl = document.getElementById('macro_{$HOST.URL}');
                if (macroHostUrl) macroHostUrl.value = `https://` + domain + '/';
                const macroUrlDomain = document.getElementById('macro_{$URL.DOMAIN}');
                if (macroUrlDomain) macroUrlDomain.value = domain;
                const macroHostName = document.getElementById('macro_{$HOST.NAME}');
                if (macroHostName) macroHostName.value = domain;
            });
        }
    }

    function saveHost() {
        const formData = new FormData(hostForm);
        const data = Object.fromEntries(formData.entries());
        if (!data.hostname || !data.hostgroup_ids) { alert('Hostname e Hostgroup IDs são obrigatórios.'); return; }

        const hostData = { protocol: data.protocol, hostname: data.hostname, tags: data.tags, hostgroup_ids: data.hostgroup_ids.split('-').map(id => id.trim()).filter(Boolean), };
        const tagPairs = (data.tags || '').split(';').map(t => t.split(':'));
        let prefix = '';
        if (data.protocol === 'URL') {
            const typeTag = tagPairs.find(t => t[0].toUpperCase() === 'TYPE');
            if (typeTag && config.urlTypePrefixes) prefix = config.urlTypePrefixes[typeTag[1].toUpperCase()] || '';
            const urlConfig = config.urlMonitoringTypes[data.url_type];
            hostData.url_type = data.url_type;
            hostData.template_ids = urlConfig.template_ids;
            hostData.macros = urlConfig.macros.map(m => ({ macro: m, value: data[`macro_${m}`] || '' }));
            hostData.ip = '127.0.0.1';
        } else {
            const equipmentTag = tagPairs.find(t => t[0].toUpperCase() === 'EQUIPMENT');
            if (equipmentTag && config.equipmentPrefixes) prefix = config.equipmentPrefixes[equipmentTag[1].toUpperCase()] || '';
            hostData.ip = data.ip;
            hostData.template_ids = data.template_ids.split('-').map(id => id.trim()).filter(Boolean);
            hostData.protocol_option = data.protocol_option;
            if (data.protocol === 'Agent') hostData.port = data.port;
        }
        hostData.visible_name = prefix ? `${prefix} ${hostData.hostname}` : hostData.hostname;

        if (data.ip2 || data.port2) {
            hostData.second_interface = {
                ip: data.ip2 || '',
                port: data.port2 || ''
            };
        }

        if (editingUpdateIndex !== null) {
            hostsToUpdate[editingUpdateIndex] = hostData;
            updateLog(`Host "${hostData.hostname}" atualizado na lista de atualização.`, 'SUCCESS');
            renderUpdateTable();
        } else if (editingIndex !== null) {
            hosts[editingIndex] = hostData;
            updateLog(`Host "${hostData.hostname}" atualizado na lista.`, 'SUCCESS');
            renderTable();
        } else {
            hosts.push(hostData);
            updateLog(`Host "${hostData.hostname}" adicionado à lista.`, 'SUCCESS');
            renderTable();
        }

        editingIndex = null;
        editingUpdateIndex = null;
        hostModal.hide();
    }

    function openImportTxtModal(mode = 'create') {
        const protocol = protocolSelector.value;
        const urlType = dynamicField.value;
        if (protocol === 'URL' && !urlType) { alert('Selecione um Tipo de Monitoramento.'); return; }

        importTxtModalLabel.textContent = mode === 'create' ? `Criar Hosts de TXT (${protocol})` : `Atualizar Hosts no Zabbix via TXT`;
        formatHint.textContent = (mode === 'create' && protocol !== 'URL') ? 'Formato: hostname;ip' : 'Formato para Atualização: hostname;ip_da_segunda_interface';

        const dynamicContent = importTxtForm.querySelector('.dynamic-content');
        if (dynamicContent) dynamicContent.remove();

        let commonFields = `<input type="hidden" name="protocol" value="${protocol}">`;
        if (mode === 'update') {
            commonFields += `
                <p class="text-danger small">Atenção: Apenas campos preenchidos aqui serão alterados em todos os hosts do arquivo. O IP da 2ª interface virá do arquivo.</p>
                <div class="mb-3"><label class="form-label">Novos Hostgroup IDs</label><input type="text" class="form-control" name="hostgroup_ids"></div>
                <div class="mb-3"><label class="form-label">Novos Template IDs</label><input type="text" class="form-control" name="template_ids"></div>
                <div class="mb-3"><label class="form-label">Novas Tags</label><input type="text" class="form-control" name="tags" placeholder="Ex: EQUIPMENT:LINK"></div>
            `;
        } else {
            if (protocol === 'URL') {
                const urlConfig = config.urlMonitoringTypes[urlType];
                commonFields += `<input type="hidden" name="url_type" value="${urlType}"><div class="mb-3"><label class="form-label">Hostgroup IDs</label><input type="text" class="form-control" name="hostgroup_ids" required></div><div class="mb-3"><label class="form-label">Tags Adicionais</label><input type="text" class="form-control" name="tags" value="${urlConfig.default_tag || ''}"></div>`;
            } else {
                commonFields += `<input type="hidden" name="protocol_option" value="${protocol.startsWith('SNMP') ? dynamicField.value : ''}"><div class="mb-3"><label class="form-label">Hostgroup IDs</label><input type="text" class="form-control" name="hostgroup_ids" required></div><div class="mb-3"><label class="form-label">Template IDs</label><input type="text" class="form-control" name="template_ids" required></div><div class="mb-3"><label class="form-label">Tags</label><input type="text" class="form-control" name="tags" placeholder="EQUIPMENT:VIRTUAL_SERVER"></div>`;
            }
        }

        const wrapper = document.createElement('div');
        wrapper.className = 'dynamic-content';
        wrapper.innerHTML = commonFields;
        importTxtForm.prepend(wrapper);
        importTxtModal._element.dataset.mode = mode;
        importTxtModal.show();
    }

    async function processTxtFile() {
        const mode = importTxtModal._element.dataset.mode;
        const file = txtFile.files[0];
        if (!file) { alert('Selecione um arquivo.'); return; }

        const reader = new FileReader();
        reader.onload = async function(event) {
            const lines = event.target.result.split('\n').filter(line => line.trim() !== '');
            const formData = new FormData(importTxtForm);
            const commonData = Object.fromEntries(formData.entries());

            if (mode === 'update') {
                const apiUrl = apiUrlInput.value.trim(), username = usernameInput.value.trim(), password = passwordInput.value;
                if (!apiUrl || !username || !password) { alert("Preencha as credenciais Zabbix para continuar."); return; }

                hostsToUpdate = [];
                lines.forEach(line => {
                    // --- CORREÇÃO IMPORTANTE AQUI ---
                    const parts = line.trim().split(';');
                    const hostname = parts[0];
                    const secondIpFromTxt = parts.length > 1 ? parts[1].trim() : null;
                    // --- FIM DA CORREÇÃO ---

                    if (!hostname) return;
                    const hostUpdateData = { hostname: hostname };

                    if (commonData.hostgroup_ids) hostUpdateData.hostgroup_ids = commonData.hostgroup_ids.split('-').map(id => id.trim()).filter(Boolean);
                    if (commonData.template_ids) hostUpdateData.template_ids = commonData.template_ids.split('-').map(id => id.trim()).filter(Boolean);
                    if (commonData.tags) hostUpdateData.tags = commonData.tags;

                    let prefix = '';
                    if (hostUpdateData.tags && config.equipmentPrefixes) {
                        const tagPairs = (hostUpdateData.tags || '').split(';').map(t => t.split(':'));
                        const equipmentTag = tagPairs.find(t => t[0].toUpperCase() === 'EQUIPMENT');
                        if (equipmentTag && config.equipmentPrefixes) {
                            prefix = config.equipmentPrefixes[equipmentTag[1].toUpperCase()] || '';
                        }
                    }
                    hostUpdateData.visible_name = prefix ? `${prefix} ${hostUpdateData.hostname}` : hostUpdateData.hostname;

                    // --- CORREÇÃO IMPORTANTE AQUI ---
                    if (secondIpFromTxt) {
                        hostUpdateData.second_interface = {
                            ip: secondIpFromTxt,
                            port: '10050' // Porta padrão para a segunda interface, pode ser alterada se necessário
                        };
                    }
                    // --- FIM DA CORREÇÃO ---

                    hostsToUpdate.push(hostUpdateData);
                });

                if (hostsToUpdate.length === 0) {
                    updateLog('Nenhum host válido no arquivo para atualizar.', 'WARN');
                    return;
                }

                importTxtModal.hide();
                document.getElementById('update-section').style.display = 'block';
                renderUpdateTable();
                updateLog(`Foram carregados ${hostsToUpdate.length} hosts para atualização. Verifique os dados e envie ao Zabbix.`, 'INFO');

            } else { // 'create' mode
                const newHosts = [];
                let errorCount = 0;
                lines.forEach(line => {
                    const hostData = {};
                    if (commonData.protocol === 'URL') {
                        hostData.hostname = line.trim();
                        hostData.ip = '127.0.0.1';
                    } else {
                        const parts = line.trim().split(';');
                        if (parts.length < 2) { errorCount++; return; }
                        hostData.hostname = parts[0];
                        hostData.ip = parts[1];
                    }

                    if (!hostData.hostname) return;
                    hostData.protocol = commonData.protocol;
                    hostData.tags = commonData.tags;
                    hostData.hostgroup_ids = commonData.hostgroup_ids.split('-').map(id => id.trim()).filter(Boolean);

                    const tagPairs = (commonData.tags || '').split(';').map(t => t.split(':'));
                    let prefix = '';
                    if (commonData.protocol === 'URL') {
                         const urlConfig = config.urlMonitoringTypes[commonData.url_type];
                         hostData.url_type = commonData.url_type;
                         hostData.template_ids = urlConfig.template_ids;
                         hostData.macros = urlConfig.macros.map(m => ({ macro: m, value: (m === '{$URL.DOMAIN}' || m === '{$HOST.NAME}') ? hostData.hostname : '' }));
                         const typeTag = tagPairs.find(t => t[0].toUpperCase() === 'TYPE');
                         if (typeTag && config.urlTypePrefixes) prefix = config.urlTypePrefixes[typeTag[1].toUpperCase()] || '';
                    } else {
                        hostData.template_ids = commonData.template_ids.split('-').map(id => id.trim()).filter(Boolean);
                        hostData.protocol_option = commonData.protocol_option;
                        const equipmentTag = tagPairs.find(t => t[0].toUpperCase() === 'EQUIPMENT');
                        if (equipmentTag && config.equipmentPrefixes) prefix = config.equipmentPrefixes[equipmentTag[1].toUpperCase()] || '';
                    }
                    hostData.visible_name = prefix ? `${prefix} ${hostData.hostname}` : hostData.hostname;
                    newHosts.push(hostData);
                });

                if (errorCount > 0) updateLog(`${errorCount} linhas ignoradas no TXT por formato inválido.`, 'WARN');
                if (newHosts.length > 0) {
                    hosts.push(...newHosts);
                    renderTable();
                    updateLog(`${newHosts.length} hosts adicionados à lista.`, 'SUCCESS');
                }
                importTxtModal.hide();
            }
        };
        reader.readAsText(file);
    }

    // ===================================================================
    //  EVENT LISTENERS & INITIALIZATION
    // ===================================================================

    function initializeApp() {
        updateLog('Aplicação iniciada. Carregando configurações...');
        fetch('/api/config')
            .then(response => { if (!response.ok) throw new Error(`Falha na rede: ${response.statusText}`); return response.json(); })
            .then(data => {
                config = data;
                statusLight.className = 'status-light-on';
                statusLight.title = 'Conectado ao Backend!';
                updateLog('Configurações carregadas.', 'SUCCESS');
                updateProtocolOptions();
                renderTable();
            })
            .catch(error => {
                statusLight.className = 'status-light-error';
                statusLight.title = 'Falha ao conectar ao Backend!';
                updateLog(`Erro ao carregar configurações: ${error.message}`, 'ERROR');
            });
    }

    protocolSelector.addEventListener('change', updateProtocolOptions);
    addHostBtn.addEventListener('click', () => openHostModal(null));
    saveHostBtn.addEventListener('click', saveHost);
    createTxtBtn.addEventListener('click', () => openImportTxtModal('create'));
    updateTxtBtn.addEventListener('click', () => openImportTxtModal('update'));
    processTxtBtn.addEventListener('click', processTxtFile);
    clearAllBtn.addEventListener('click', () => { if (confirm('Tem certeza?')) { hosts = []; renderTable(); updateLog('Lista limpa.', 'WARN'); } });

    hostTableBody.addEventListener('click', (event) => {
        const button = event.target.closest('button');
        if (!button) return;
        const row = button.closest('tr');
        const index = parseInt(row.dataset.index, 10);
        if (button.classList.contains('btn-edit')) openHostModal(index);
        if (button.classList.contains('btn-delete')) { if (confirm(`Excluir "${hosts[index].hostname}" da lista?`)) { hosts.splice(index, 1); renderTable(); } }
    });

    document.getElementById('updateTableBody').addEventListener('click', (event) => {
        const button = event.target.closest('button');
        if (!button) return;
        const row = button.closest('tr');
        const index = parseInt(row.dataset.index, 10);
        if (button.classList.contains('btn-edit-update')) {
            openUpdateHostModal(index);
        }
        if (button.classList.contains('btn-delete-update')) {
            if (confirm(`Excluir "${hostsToUpdate[index].hostname}" da lista de atualização?`)) {
                hostsToUpdate.splice(index, 1);
                renderUpdateTable();
            }
        }
    });

    importToZabbixBtn.addEventListener('click', async () => {
        if (hosts.length === 0) { alert("Nenhum host na lista para importar!"); return; }
        const apiUrl = apiUrlInput.value.trim(), username = usernameInput.value.trim(), password = passwordInput.value;
        if (!apiUrl || !username || !password) { alert("Preencha as credenciais Zabbix."); return; }

        updateLog(`Iniciando CRIAÇÃO de ${hosts.length} hosts no Zabbix...`);
        importToZabbixBtn.disabled = true;
        importToZabbixBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Criando...';
        try {
            const response = await fetch('/api/import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ apiUrl, username, password, hosts }), });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Erro no servidor.');
            updateLog(`Processo de criação concluído.`, 'SUCCESS');
            result.results.forEach(res => updateLog(`  - ${res.hostname}: ${res.message}`, res.status === 'success' ? 'SUCCESS' : 'ERROR'));
        } catch(error) {
            updateLog(`Erro crítico na criação: ${error.message}`, 'ERROR');
        } finally {
            importToZabbixBtn.disabled = false;
            importToZabbixBtn.innerHTML = '<i class="bi bi-send"></i> Criar no Zabbix';
        }
    });

    document.getElementById('updateToZabbixBtn').addEventListener('click', async () => {
        if (hostsToUpdate.length === 0) { alert("Nenhum host para atualizar!"); return; }
        const apiUrl = apiUrlInput.value.trim(), username = usernameInput.value.trim(), password = passwordInput.value;
        if (!apiUrl || !username || !password) { alert("Preencha as credenciais Zabbix."); return; }
        updateLog(`Iniciando ATUALIZAÇÃO de ${hostsToUpdate.length} hosts no Zabbix...`);
        try {
            const response = await fetch('/api/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ apiUrl, username, password, hosts: hostsToUpdate }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Erro no servidor.');
            updateLog(`Processo de atualização concluído.`, 'SUCCESS');
            result.results.forEach(res => updateLog(`  - ${res.hostname}: ${res.message}`, res.status === 'success' ? 'SUCCESS' : 'ERROR'));
            document.getElementById('update-section').style.display = 'none';
            hostsToUpdate = [];
        } catch (error) {
            updateLog(`Erro crítico na atualização: ${error.message}`, 'ERROR');
        }
    });

    editMassBtn.addEventListener('click', () => { massEditForm.reset(); massEditModal.show(); });
    saveMassEditBtn.addEventListener('click', () => {
        const formData = new FormData(massEditForm);
        const newData = Object.fromEntries(formData.entries());
        const selectedIndices = Array.from(document.querySelectorAll('.host-checkbox:checked')).map(cb => parseInt(cb.value, 10));
        let changedFields = 0;
        selectedIndices.forEach(index => {
            const host = hosts[index];
            if (newData.hostgroup_ids) { host.hostgroup_ids = newData.hostgroup_ids.split('-').map(id => id.trim()).filter(Boolean); changedFields++; }
            if (newData.template_ids && host.protocol !== 'URL') { host.template_ids = newData.template_ids.split('-').map(id => id.trim()).filter(Boolean); changedFields++; }
            if (newData.tags) {
                host.tags = newData.tags;
                const tagPairs = (host.tags || '').split(';').map(t => t.split(':'));
                let prefix = '';
                if (host.protocol === 'URL') {
                    const typeTag = tagPairs.find(t => t[0].toUpperCase() === 'TYPE');
                    if (typeTag && config.urlTypePrefixes) prefix = config.urlTypePrefixes[typeTag[1].toUpperCase()] || '';
                } else {
                    const equipmentTag = tagPairs.find(t => t[0].toUpperCase() === 'EQUIPMENT');
                    if (equipmentTag && config.equipmentPrefixes) prefix = config.equipmentPrefixes[equipmentTag[1].toUpperCase()] || '';
                }
                host.visible_name = prefix ? `${prefix} ${host.hostname}` : host.hostname;
                changedFields++;
            }
        });
        if (changedFields > 0) { renderTable(); updateLog(`${selectedIndices.length} hosts atualizados na lista.`, 'SUCCESS'); }
        massEditModal.hide();
        updateMassEditControls();
    });

    selectAllCheckbox.addEventListener('change', (event) => { document.querySelectorAll('.host-checkbox').forEach(checkbox => checkbox.checked = event.target.checked); updateMassEditControls(); });
    hostTableBody.addEventListener('change', (event) => { if (event.target.classList.contains('host-checkbox')) { updateMassEditControls(); } });

    initializeApp();
});