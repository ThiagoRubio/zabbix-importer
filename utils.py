# START OF FILE utils.py

def process_tags(tags_str, logger=None):
    """
    Converte uma string de tags em uma lista de dicionários.
    Exemplo: "EQUIPMENT:SWITCH;LOCATION:DC1" -> [{"tag": "EQUIPMENT", "value": "SWITCH"}, ...]
    """
    tags = []
    if tags_str:
        for pair in tags_str.split(';'):
            if not pair: continue # Ignora strings vazias
            try:
                tag, value = pair.split(':', 1)
                tags.append({"tag": tag.strip(), "value": value.strip()})
            except ValueError:
                if logger:
                    logger.warning(f"⚠️ Tag inválida ignorada: '{pair}'")
    return tags

def get_equipment_prefix(tags, equipment_prefixes, logger=None):
    """
    Retorna o prefixo com base na tag EQUIPMENT e no dicionário de prefixos.
    'tags' aqui deve ser uma lista de dicionários, como a retornada por process_tags.
    """
    try:
        equipment_type = next(
            (tag['value'].upper() for tag in tags if tag['tag'].upper() == 'EQUIPMENT'),
            None
        )
        return equipment_prefixes.get(equipment_type, '') if equipment_type else ''
    except Exception as e:
        if logger:
            logger.error(f"Erro ao obter prefixo do equipamento: {e}")
        return ''

# Adicionamos a função de prefixo de URL aqui também para centralizar
def get_url_prefix_from_type_tag(tags, url_type_prefixes, logger=None):
    """
    Retorna o prefixo com base na tag TYPE e no dicionário de prefixos de URL.
    'tags' aqui deve ser uma lista de dicionários.
    """
    try:
        url_type = next(
            (tag['value'].upper() for tag in tags if tag['tag'].upper() == 'TYPE'),
            None
        )
        return url_type_prefixes.get(url_type, '') if url_type else ''
    except Exception as e:
        if logger:
            logger.error(f"Erro ao obter prefixo da URL: {e}")
        return ''