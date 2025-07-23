# START OF FILE constants.py

# --- NOVAS CONFIGURAÇÕES DE URL (MUDANÇA PRINCIPAL) ---

# Dicionário para configurar diferentes tipos de monitoramento de URL
# O usuário selecionará uma dessas chaves na interface.
# IMPORTANTE: SUBSTITUA OS 'uuid...' PELOS IDs NUMÉRICOS REAIS DO SEU ZABBIX.
URL_MONITORING_TYPES = {
    "Certificado SSL": {
        "template_ids": ["11143"], # ID do template 'support-production-ssl-certificates'
        "macros": ["{$URL.DOMAIN}", "{$URL.SSL.PORT}"],
        "default_tag": "TYPE:SSL" # Tag para identificação e prefixo
    },
    "Ping Web (Disponibilidade)": {
        "template_ids": ["11141"], # ID do template 'support-production-web-ping-general'
        "macros": ["{$HOST.URL}", "{$KEYWORD}", "{$URL.EXTERNAL.IP}", "{$URL.INTERNAL.IP}"],
        "default_tag": "TYPE:WEB"
    },
    "Domínio (Expiração)": {
        "template_ids": ["11140"], # ID do template 'support-production-domain'
        "macros": ["{$HOST.NAME}"], # Este template usa o nome do host como domínio
        "default_tag": "TYPE:URL"
    }
}

# Dicionário para mapear a TAG 'TYPE' para o prefixo do nome visível
URL_TYPE_PREFIXES = {
    "SSL": "CERT",
    "WEB": "WEB",
    "URL": "DOM"  # 'URL' é o tipo para Domínio
}

# --- FIM DAS NOVAS CONFIGURAÇÕES DE URL ---


# Prefixos para tipos de equipamentos (sem alteração)
EQUIPMENT_PREFIXES = {
    "FIREWALL": "FW",
    "SWITCH": "SW",
    "ACCESS_POINT": "AP",
    "LINK": "LINK",
    "VIRTUAL_SERVER": "SRV",
    "PHYSICAL_HOST": "SRV"
}

# Mapeamento de protocolos SNMPv3 (sem alteração)
SNMPV3_PROTOCOL_MAP = {
    "MD5": 0,
    "SHA": 1
}

# Communities para SNMPv2 (sem alteração)
SNMPV2_COMMUNITIES = [
    "nMSc0rpFL3x",
    "nM$.c0rpF!3x",
    "$gR.c0rpFL3x",
    "sLwC0rPflEx"
]

# Configurações para SNMPv3 (sem alteração)
SNMPV3_CONFIGS = {
    "solarwinds.noc": {
        "auth_protocol": "MD5",
        "auth_key": "Monit0r@m3nto",
        "priv_protocol": None,
        "priv_key": None
    },
    "outro_usuario": {
        "auth_protocol": "SHA",
        "auth_key": "SenhaDiferente",
        "priv_protocol": "AES",
        "priv_key": "PrivKeyAqui"
    }
}
SNMPV3_USERS = list(SNMPV3_CONFIGS.keys())