;(function () {
    'use strict';

    var $form_add_task = $(".add-task")
        ,$task_delete_trigger
        ,$task_detail = $(".task-detail")
        ,$task_detail_trigger
        , task_list = []
        ,task_detail=[]
        ,$task_detail_mask=$(".task-detail-mask")
        ;
    //initial the page.
    init();
    //俺也不知道为啥使用submit不行，所以就用button的click事件代替了，这大概就是命吧
    //俺发誓俺什么都没改，就是按昨天晚上第一次写的，现在居然可以用了。这个是玄学。。
    //事实证明，乖乖的用click事件还是可以的。。。submit不行。。。

    /*=====DEBUG========*/
    $("button[name=clear]").on("click",function () {
        store.clear();
        $('.task-list').html('');
        location.reload();
        console.log("clear the localStorange");
    });

    /*====DEBUG=======*/
    function init() {
        task_list=store.get('task_list')||[];
        if (task_list.length)
            render_task_list();

    }

    $form_add_task.children("button").on('click', on_add_task_from_submit);
    $task_detail_mask.on('click', hide_task_detail);
    function on_add_task_from_submit(e) {
        var $input;
        /**
         * 原来的new_task对象声明在了顶层作用域上，
         * 当input中的内容修改的时候，
         * 顶层作用域上的new_task对象被修改，
         * 使得task_list中的所有对象的值相同。
         * */
        var new_task = {};/*notice!*/
        //禁用默认行为
        e.preventDefault();
        //获取新的task的值
        $input = $(this).parents().find('input[name=content]');
        new_task.content = $input.val();
        //如果非空，存入new_task
        if (!new_task.content) return;
        task_list.push(new_task);
        if(add_task()){
            $input.val(null);
        }

    }
    function listen_task_detail() {
        $task_detail_trigger.on("click",function () {
            var $this = $(this);
            var  $item = $this.parent().parent();
            var index = $item.data('index');
           show_task_detail(index);
        })
    }
    function show_task_detail(index) {
        render_task_detail(index);
        $task_detail.show();
        $task_detail_mask.show();
    }
    function hide_task_detail(index) {
        $task_detail.hide();
        $task_detail_mask.hide();
    }
    //查找并监听所有删除按钮的点击事件
    function listen_task_delete() {
        $task_delete_trigger.on("click",function () {
            var $this=$(this);
            var $item = $this.parent().parent();
            var index=$item.data('index');
            var r =confirm('R U Sure?');
            r?delete_task(index):null;
            console.log(index);

        });
    }

    function add_task() {

        //使用store.js，简化localStorange api的调用。使用npm安装即可。
        store.set('task_list', task_list);
        render_task_list();
        return true;//一定要添加return
    }
    //刷新localStorage并更新模板
    function refresh_task_list() {
        store.set('task_list', task_list);
        render_task_list();

    }
    //删除一条task
    function delete_task(index) {
        //如果没有传入index或者在text_list中
        if(index==undefined||!task_list[index]) return;
        delete task_list[index];
        refresh_task_list();
    }

    function render_task_list() {
        var $task_list=$('.task-list');
        $task_list.html('');
        for (var i=0;i<task_list.length;i++){
            var $task = render_task_item(task_list[i],i);
            $task_list.append($task);
        }
        /**
         *jQuery不会自动更新文档流，
         * 所以在生成条目的时候，
         * 需要手动去绑定事件。
         */
        $task_delete_trigger=$(".action.delete");
        $task_detail_trigger=$(".action.detail");
        listen_task_delete();
        listen_task_detail();
        
    }
    //渲染指定task——detail
    function render_task_detail(index) {
        if (index === undefined || !task_list[index])return;
        var item =task_list[index];
        var task_detail_tpl=
            '<div class="content">' +
                item.content+
            '</div>' +
            '<div>' +
            '<div class="desc">' +
            '<textarea name="" id="" value="' +
            item.desc+
            '"></textarea>' +
            '</div>' +
            '</div>' +
            '<div class="remind">' +
            '<input type="date"/>' +
            '</div>';
        $task_detail.html("");
        $task_detail.html(task_detail_tpl);

    }
    function render_task_item(data,index) {
        if (!data||index==undefined) return;
        var list_item_tpl=
            '<li class="task-item" data-index="' + index+'">'+
            '<span><input type="checkbox"></span>'+
            '<span class="text-content">'+data.content+'</span>'+
            '<span class="fr">'+
            '<span class="action delete"> delete</span>'+
            '<span class="action detail"> detail</span>'+
            '<span>'+
            '</li>';
        return $(list_item_tpl);
    }

})();

