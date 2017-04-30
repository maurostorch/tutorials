var token = 'e0eb83c22a1cc6760afb282dde6efc9c46a5219b';
var TodoItem = React.createClass({
    getInitialState: function(){
        return ({disabled:'',ajax:''});
    },
    doneCheck: function(e){
        this.setState(function(prevState, props){
            var r;
            var xhr = new XMLHttpRequest();
            xhr.onreadystatechange = function(){
                if (xhr.readyState == XMLHttpRequest.DONE && xhr.status == 200) {
                    r = {disabled:prevState.disabled==''?'doneItem':''};
                } else if (xhr.readyState == XMLHttpRequest.DONE){
                    r = {disabled:prevState.disabled};
                }
            };
            xhr.open('PUT','/api/todos/'+props._id+'/',false);
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.setRequestHeader('Authorization','Token '+token);
            xhr.send(JSON.stringify({_id: props._id, title: props.value, desc: props.desc, done: (prevState.disabled==''?true:false)}));
            return r;
        });
    },
    render: function(){
        return (
            React.createElement('div',{className:this.state.disabled+" list-group-item"},
                this.props.value,
                React.createElement('span',{className:'glyphicon glyphicon-remove-sign pull-right', onClick: this.props.delete}),
                React.createElement('span',{className:'glyphicon pull-right glyphicon-' +(this.state.disabled==''?'ok':'refresh'), onClick:this.doneCheck})
            )
        );
    }
});
var TodoList = React.createClass({
    getInitialState: function(){
        var ilist = this.props.initialList;
        var l=[];
        for (var i=0;i<ilist.length;i++){
            var o = ilist[i];
            var newk =new Date().getTime();
            l.push(React.createElement(TodoItem,{_id:o._id,value:o.title,desc:o.desc, key:newk, delete:this.deleteItem(newk)}));
        }
        return {list:l};
    },
    deleteItem: function(k){
        var that = this;
        return (function (){
            that.setState(function(prevState, props){
                var l = prevState.list;
                var size = l.length;
                for (var i=0;i<size;i++) {
                    if (l[i].key == k) {
                        var o = l[i];
                        var xhr = new XMLHttpRequest();
                        xhr.onreadystatechange = function(){
                            if (xhr.readyState == XMLHttpRequest.DONE && xhr.status == 204) {
                                l.splice(i,1);
                            }
                        };
                        xhr.open('DELETE','/api/todos/'+o.props._id+'/',false);
                        xhr.setRequestHeader('Authorization','Token '+token);
                        xhr.send(null);
                        break;
                    }
                }
                return {list:l};
            });
        });
    },
    addItem: function(e) {
        if (e.key === 'Enter'){
            var c = e.target;
            if (c.value.trim() != '') {
                var that = this;
                this.setState(function(prevState, props){
                    var l = prevState.list;
                    var newk =new Date().getTime();

                    var xhr = new XMLHttpRequest();
                    xhr.onreadystatechange = function(){
                        if (xhr.readyState == XMLHttpRequest.DONE && xhr.status == 201) {
                            var newitem = JSON.parse(xhr.responseText);
                            l.push(React.createElement(TodoItem,{_id:newitem._id,value:newitem.title,desc:newitem.desc, key:newk, delete:that.deleteItem(newk)}));
                            c.value='';
                        }
                    };
                    xhr.open('POST','/api/todos/',false);
                    xhr.setRequestHeader('Content-Type', 'application/json');
                    xhr.setRequestHeader('Authorization','Token '+token);
                    xhr.send(JSON.stringify({title:c.value,desc:'default'}));
                });

            }
        }
    },
    render: function(){
        return (
            React.createElement('div',{className:'container-fluid'},
                React.createElement('div',{className:"list-group"}, this.state.list),
                React.createElement('div',{className:"form-group"},
                    React.createElement('input',{className:"form-control",
                                                id:"todoadd",onKeyPress:this.addItem,
                                                placeholder:"Type a new task and <Enter>"})
                )
            )
        );
    }
});
var xhr = new XMLHttpRequest();
xhr.onreadystatechange = function(){
    if (xhr.readyState == XMLHttpRequest.DONE) {
        ReactDOM.render(
            React.createElement(TodoList,{initialList:JSON.parse(xhr.responseText).results}),
            document.getElementById('container')
        );
    }
};
xhr.open('get','/api/todos',true);
xhr.setRequestHeader('Authorization','Token '+token);
xhr.send(null);
