from flask import Flask, jsonify

app = Flask(__name__)

@app.route('/challenge_reverse_apk_NHK', methods=['GET'])
def get_segments():
    return jsonify({
        "segment_1": "TkhLMjZ7TGVfcmV2ZXJzZV9",      
        "segment_3": "hbmRyb2lkX2VzdF90cm9",         
        "segment_2": "wX2ZhY2lsZX0="   
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
