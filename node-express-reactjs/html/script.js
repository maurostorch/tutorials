var ToDoItem = React.createClass({
    toogle: function() {
        var that = this;
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange=function(){
            if (xhr.readyState == 4 && xhr.status == 200){
                //that.props.status=1^that.props.status;
                //that.setState({status: (that.props.status==0?'done':'')});
            }
        }
        var url = '/todo/'+this.props.id;
        xhr.open('PUT',url,true);
        xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
        xhr.send(JSON.stringify({id:this.props.id,description:this.props.description,done:(1^this.props.status)}));
    },
    delete: function() {
        var xhr = new XMLHttpRequest();
        var url = '/todo/'+this.props.id;
        xhr.open('DELETE',url,true);
        xhr.send();
    },
    render: function(){
        return React.createElement('li',{className: this.props.status?'done':'', onClick: this.toogle},
                this.props.description,
                React.createElement('span',{onClick:this.delete},'x'));
    }
});
var ToDoList = React.createClass({
    source:null,
    getInitialState: function() {
        return ({list:[]});
    },
    componentDidMount: function() {
        var that = this;
        this.source = new EventSource('/todo/stream');
        this.source.onmessage=this.update;
        var xhr = new XMLHttpRequest();
        xhr.open('GET', '/todo',true);
        xhr.onreadystatechange=function() {
            if (xhr.readyState != 4 || xhr.status != 200) return;
            that.setState({list:JSON.parse(xhr.responseText)});
        };
        xhr.send();
    },
    update: function(e) {
        var data = JSON.parse(e.data);
        if(data.op == 'new'){
            var newlist = this.state.list;
            newlist.push(data.obj);
            this.setState({list:newlist});
        } else if(data.op == 'update') {
            var newlist = this.state.list;
            for(i=0;i<newlist.length;i++) {
                if (newlist[i].id == data.obj.id) {
                    newlist[i]=data.obj;
                    break;
                }
            }
            this.setState({list:newlist});
        } else if(data.op == 'delete') {
            var newlist = this.state.list;
            for(i=0;i<newlist.length;i++) {
                if (newlist[i].id == data.obj.id) {
                    newlist.splice(i,1);
                    break;
                }
            }
            this.setState({list:newlist});
        }

    },
    add: function(e) {
        var f = document.querySelector('[name=description]');
        if(f.value.trim().length==0) return false;
        var xhr = new XMLHttpRequest();
        xhr.open('POST', '/todo',true);
        xhr.onreadystatechange=function() {
            if (xhr.readyState != 4 || xhr.status != 200) return;
            //that.setState({list:JSON.parse(xhr.responseText)});
            f.value='';
        };
        xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
        xhr.send(JSON.stringify({description:f.value}));
        return false;
    },
    render: function() {
        var form = React.createElement('div',{},
            React.createElement('input',{name:'description'}),
            React.createElement('button',{onClick:this.add},'Add')
        );
        var todos=[];
        for(i=0;i<this.state.list.length;i++){
            var todo = this.state.list[i];
            todos.push(React.createElement(ToDoItem,{key:todo.id,id:todo.id,description:todo.description,status:todo.done}));
        };
        return React.createElement('div',{},
            form,
            React.createElement('ul',{},todos)
        );
    },
});
ReactDOM.render(React.createElement(ToDoList,{list:[]}),document.getElementById('container'));
//ReactDOM.render(React.createElement(ToDoItem,{description:'tomate'}),document.getElementById('container'));
