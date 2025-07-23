# START OF FILE app.py

from flask import Flask, request, jsonify, render_template
import logging
import urllib3
import zabbix_logic

# --- CORREÇÃO: Importa TODAS as configurações que o frontend precisa ---
from constants import (
    EQUIPMENT_PREFIXES,
    URL_TYPE_PREFIXES,
    URL_MONITORING_TYPES,
    SNMPV2_COMMUNITIES,
    SNMPV3_USERS
)

# Configurações iniciais
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/config')
def get_config():
    # --- CORREÇÃO: A rota agora envia TODAS as configurações necessárias ---
    config_data = {
        "equipmentPrefixes": EQUIPMENT_PREFIXES,
        "urlTypePrefixes": URL_TYPE_PREFIXES,
        "urlMonitoringTypes": URL_MONITORING_TYPES,
        "snmpv2Communities": SNMPV2_COMMUNITIES,
        "snmpv3Users": SNMPV3_USERS
    }
    return jsonify(config_data)

@app.route('/api/import', methods=['POST'])
def api_create_hosts():
    # Esta rota já estava funcionando, nenhuma alteração necessária
    results = []
    try:
        data = request.get_json()
        auth_token = zabbix_logic.zabbix_login(data['apiUrl'], data['username'], data['password'])
        for host_data in data.get('hosts', []):
            hostname = host_data.get('hostname', 'N/A')
            try:
                zabbix_logic.create_zabbix_host(data['apiUrl'], auth_token, host_data)
                results.append({'hostname': hostname, 'status': 'success', 'message': 'Criado com sucesso.'})
            except Exception as e:
                results.append({'hostname': hostname, 'status': 'error', 'message': str(e)})
    except Exception as e:
        return jsonify({'message': str(e)}), 500
    return jsonify({'results': results})

@app.route('/api/update', methods=['POST'])
def api_update_hosts():
    # Esta rota já estava funcionando, nenhuma alteração necessária
    results = []
    try:
        data = request.get_json()
        auth_token = zabbix_logic.zabbix_login(data['apiUrl'], data['username'], data['password'])
        for host_data in data.get('hosts', []):
            hostname = host_data.get('hostname', 'N/A')
            try:
                zabbix_logic.update_zabbix_host(data['apiUrl'], auth_token, host_data)
                results.append({'hostname': hostname, 'status': 'success', 'message': 'Atualizado com sucesso.'})
            except Exception as e:
                results.append({'hostname': hostname, 'status': 'error', 'message': str(e)})
    except Exception as e:
        return jsonify({'message': str(e)}), 500
    return jsonify({'results': results})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)