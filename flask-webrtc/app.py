from flask import Flask, Response, request, send_from_directory
from flask_session import Session
from Queue import Queue
import os, json
app = Flask(__name__)
app.config.from_object(__name__)
Session(app)
subscriptions = {}

def event(q):
    connected = True
    while connected:
        try:
            yield 'data: '+ json.dumps(q.get()) + '\n\n'
        except:
            connected = False

@app.route("/")
def root():
    return send_from_directory('./','index.html')

@app.route("/<path:path>")
def files(path):
    return send_from_directory('./',path)

@app.route('/discover', methods=['GET'])
def discover():
    files = os.listdir('./calls')
    for f in files:
        if not os.path.isfile('./calls/'+f+'/answer'):
            return f
    return '',404

@app.route("/offer/<callid>",methods=['GET','POST'])
def offer(callid):
    #offer=request.form['offer'];
    #user=request.form['user'];
    try:
        os.makedirs('./calls/'+callid)
    except:
        pass
    wd='./calls/'+callid+'/'
    o=request.json
    if request.method == 'POST':
        f=open(wd+'offer','w')
        f.write(json.dumps(o['type']))
        f.close()
        return 'ok'
    else:
        try:
            f=open(wd+'offer','r')
            return f.read()
        except:
            return 'not found', 404

@app.route("/answer/<callid>",methods=['GET','POST'])
def answer(callid):
    #offer=request.form['offer'];
    #user=request.form['user'];
    try:
        os.makedirs('./calls/'+callid)
    except:
        pass
    wd='./calls/'+callid+'/'
    o=request.json
    if subscriptions.get(callid) is None:
        subscriptions[callid] = {}
    if subscriptions[callid].get('answer') is None:
        subscriptions[callid]['answer']=Queue()
        subscriptions[callid]['answer'].put('FIRSTCALL')
    if request.method == 'POST':
        f=open(wd+'answer','w')
        f.write(json.dumps(o['type']))
        f.close()
        subscriptions[callid]['answer'].put(o['type'])
        return 'ok'
    else:
        return Response(event(subscriptions[callid]['answer']), mimetype="text/event-stream")

@app.route("/candidate/<ttype>/<callid>",methods=['GET','POST'])
def candidate(ttype,callid):
    #candidate=request.form['candidade'];
    #user=request.form['user'];
    try:
        os.makedirs('./calls/'+callid)
    except:
        pass
    wd='./calls/'+callid+'/'
    o=request.json
    if subscriptions.get(callid) is None:
        subscriptions[callid] = {}
    if subscriptions[callid].get('candidate-'+ttype) is None:
        subscriptions[callid]['candidate-'+ttype]=Queue()
        subscriptions[callid]['candidate-'+ttype].put('FIRSTCALL')
    if request.method == 'POST':
        f=open(wd+'candidates','a+')
        if len(f.read())>0:
            f.write('\n')
        f.write(json.dumps(o['type']))
        f.close()
        subscriptions[callid]['candidate-'+ttype].put(o['type'])
        return 'ok'
    else:
        return Response(event(subscriptions[callid]['candidate-'+ttype]), mimetype="text/event-stream")

if __name__ == "__main__":
    try:
        app.run(threaded=True,debug=True)
    except:
        print 'Interrupted...'
