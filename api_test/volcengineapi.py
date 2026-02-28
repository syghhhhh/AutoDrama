# 接口文档地址 https://www.volcengine.com/docs/85621/1817045?lang=zh#43JbFxKn
# https://www.volcengine.com/docs/6444/1390583?lang=zh
import json
import sys
import os
import base64
import datetime
import hashlib
import hmac
import requests
import time


method = 'POST'
host = 'visual.volcengineapi.com'
region = 'cn-north-1'
endpoint = 'https://visual.volcengineapi.com'
service = 'cv'

def sign(key, msg):
    return hmac.new(key, msg.encode('utf-8'), hashlib.sha256).digest()

def getSignatureKey(key, dateStamp, regionName, serviceName):
    kDate = sign(key.encode('utf-8'), dateStamp)
    kRegion = sign(kDate, regionName)
    kService = sign(kRegion, serviceName)
    kSigning = sign(kService, 'request')
    return kSigning

def formatQuery(parameters):
    request_parameters_init = ''
    for key in sorted(parameters):
        request_parameters_init += key + '=' + parameters[key] + '&'
    request_parameters = request_parameters_init[:-1]
    return request_parameters

def signV4Request(access_key, secret_key, service, req_query, req_body):
    if access_key is None or secret_key is None:
        print('No access key is available.')
        sys.exit()

    # t = datetime.datetime.utcnow()
    t = datetime.datetime.now(datetime.timezone.utc)
    current_date = t.strftime('%Y%m%dT%H%M%SZ')
    # current_date = '20210818T095729Z'
    datestamp = t.strftime('%Y%m%d')  # Date w/o time, used in credential scope
    canonical_uri = '/'
    canonical_querystring = req_query
    signed_headers = 'content-type;host;x-content-sha256;x-date'
    payload_hash = hashlib.sha256(req_body.encode('utf-8')).hexdigest()
    content_type = 'application/json'
    canonical_headers = 'content-type:' + content_type + '\n' + 'host:' + host + \
        '\n' + 'x-content-sha256:' + payload_hash + \
        '\n' + 'x-date:' + current_date + '\n'
    canonical_request = method + '\n' + canonical_uri + '\n' + canonical_querystring + \
        '\n' + canonical_headers + '\n' + signed_headers + '\n' + payload_hash
    # print(canonical_request)
    algorithm = 'HMAC-SHA256'
    credential_scope = datestamp + '/' + region + '/' + service + '/' + 'request'
    string_to_sign = algorithm + '\n' + current_date + '\n' + credential_scope + '\n' + hashlib.sha256(
        canonical_request.encode('utf-8')).hexdigest()
    # print(string_to_sign)
    signing_key = getSignatureKey(secret_key, datestamp, region, service)
    # print(signing_key)
    signature = hmac.new(signing_key, (string_to_sign).encode(
        'utf-8'), hashlib.sha256).hexdigest()
    # print(signature)

    authorization_header = algorithm + ' ' + 'Credential=' + access_key + '/' + \
        credential_scope + ', ' + 'SignedHeaders=' + \
        signed_headers + ', ' + 'Signature=' + signature
    # print(authorization_header)
    headers = {'X-Date': current_date,
               'Authorization': authorization_header,
               'X-Content-Sha256': payload_hash,
               'Content-Type': content_type
               }
    # print(headers)

    # ************* SEND THE REQUEST *************
    request_url = endpoint + '?' + canonical_querystring

    print('\nBEGIN REQUEST++++++++++++++++++++++++++++++++++++')
    print('Request URL = ' + request_url)
    try:
        r = requests.post(request_url, headers=headers, data=req_body)
    except Exception as err:
        print(f'error occurred: {err}')
        raise
    else:
        print('\nRESPONSE++++++++++++++++++++++++++++++++++++')
        print(f'Response code: {r.status_code}\n')
        # 使用 replace 方法将 \u0026 替换为 &
        resp_str = r.text.replace("\\u0026", "&")
        print(f'Response body: {resp_str}\n')
    return resp_str


if __name__ == "__main__":
    # 请求凭证，从访问控制申请
    # access_key = 'AK*****'
    # secret_key = '*****=='
    volcengine_access_key = os.getenv("volcengine_access_key")
    volcengine_secret_key = os.getenv("volcengine_secret_key")

    # 请求Query，按照接口文档中填入即可
    query_params = {
        'Action': 'CVSync2AsyncSubmitTask',
        'Version': '2022-08-31',
    }
    formatted_query = formatQuery(query_params)

    # 请求Body，按照接口文档中填入即可
    body_params = {
        "req_key": "jimeng_t2i_v40",
        "image_urls": [
            # "https://xxxx",
        ],
        "prompt": "生成两张美女的照片",
        "scale": 0.5
    }
    formatted_body = json.dumps(body_params)
    
    resp_str = signV4Request(volcengine_access_key, volcengine_secret_key, service,
                  formatted_query, formatted_body)
    """
    [sample 1]
    BEGIN REQUEST++++++++++++++++++++++++++++++++++++
    Request URL = https://visual.volcengineapi.com?Action=CVSync2AsyncSubmitTask&Version=2022-08-31

    RESPONSE++++++++++++++++++++++++++++++++++++
    Response code: 200

    Response body: {"code":10000,"data":{"task_id":"3669776714212311391"},"message":"Success","request_id":"20260227175801474B966D24DCA1029B75","status":10000,"time_elapsed":"42.709796ms"}
    
    [sample 2]
    BEGIN REQUEST++++++++++++++++++++++++++++++++++++
    Request URL = https://visual.volcengineapi.com?Action=CVSync2AsyncSubmitTask&Version=2022-08-31

    RESPONSE++++++++++++++++++++++++++++++++++++
    Response code: 200

    Response body: {"code":10000,"data":{"task_id":"14790660436661235288"},"message":"Success","request_id":"2026022810021319610F3CF59B8D27B8AC","status":10000,"time_elapsed":"45.989896ms"}
    """
    resp_json = json.loads(resp_str)
    task_id = resp_json.get("data", {}).get("task_id", "")
    request_id = resp_json.get("request_id", "")
    # time.sleep(5)
    # 2. 轮询查询任务状态（模拟异步任务等待）
    
    # task_id = "3669776714212311391"
    if task_id:
        while True:
            # 请求Query，按照接口文档中填入即可
            query_params = {
                'Action': 'CVSync2AsyncGetResult',
                'Version': '2022-08-31',
            }
            formatted_query = formatQuery(query_params)

            # 请求Body，按照接口文档中填入即可
            body_params = {
                "req_key": "jimeng_t2i_v40",
                "task_id":  task_id,
                "req_json": "{\"logo_info\":{\"add_logo\":false},\"return_url\":true}"
            }
            formatted_body = json.dumps(body_params)
            
            resp_str = signV4Request(volcengine_access_key, volcengine_secret_key, service,
                        formatted_query, formatted_body)
            """
            [sample 1]
            BEGIN REQUEST++++++++++++++++++++++++++++++++++++
            Request URL = https://visual.volcengineapi.com?Action=CVSync2AsyncGetResult&Version=2022-08-31

            RESPONSE++++++++++++++++++++++++++++++++++++
            Response code: 200

            Response body: {"code":10000,"data":{"aigc_meta_tagged":false,"binary_data_base64":[],"image_urls":null,"status":"in_queue","video_url":""},"message":"Success","request_id":"20260228100222105C0438D0C2CB3A5144","status":10000,"time_elapsed":"10.508995ms"}
            
            [sample 2]
            BEGIN REQUEST++++++++++++++++++++++++++++++++++++
            Request URL = https://visual.volcengineapi.com?Action=CVSync2AsyncGetResult&Version=2022-08-31

            RESPONSE++++++++++++++++++++++++++++++++++++
            Response code: 200

            Response body: {"code":10000,"data":{"aigc_meta_tagged":false,"binary_data_base64":null,"image_urls":["https://p9-aiop-sign.byteimg.com/tos-cn-i-vuqhorh59i/2026022810261464FD97FA720FD7289414-4354-0~tplv-vuqhorh59i-image-v1.image?rk3s=7f9e702d&x-expires=1772331974&x-signature=3LgE0rjd0wpmQw1GiMBbSfVFqYM%3D"],"status":"done","video_url":""},"message":"Success","request_id":"2026022810261464FD97FA720FD7289414","status":10000,"time_elapsed":"342.1279ms"
            """
            resp_json = json.loads(resp_str)
            code = resp_json.get("code")
            if code != 10000:
                print(f"Code: {code}, Error: {resp_json.get("message")}")
                break
            status = resp_json.get("data").get("status")
            if status == "in_queue" or status == "generating":
                time.sleep(5)
            elif status == "done":
                message = resp_json.get("message")
                if message == "Success":
                    print(f"{resp_json.get('data')}")
                else:
                    print(f"[{message}]{resp_json.get('data')}")
                break
            # todo: 下载图片地址, 保存入库
                    
            