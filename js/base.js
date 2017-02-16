;(function () {
    'use strict';

    var $form_add_task = $(".add-task")
        ,$window = $(window)
        ,$body = $("body")
        ,$task_delete_trigger
        ,$task_detail_mask=$(".task-detail-mask")
        ,$task_detail = $(".task-detail")
        ,$task_detail_trigger
        , task_list = []
        ,current_index
        ,$update_form
        ,$task_detail_content
        ,$task_detail_content_input
        ,$checkbox_complete
        ,$msg =$(".msg")
        ,$msg_content =$msg.find(".msg-content")
        ,$msg_confirm =$msg.find(".confirmed")
        ,complete_items=[]
        ,$alerter = $(".alerter")
    ;
    //initial the page.
    init();


    $(document).bind("contextmenu",function(){
        return false;
    });

    /*问题找到了。因为submit事件只是表单元素才有的事件，也就是只有在form里边才可以使用submit事件*/
    function init() {
        task_list=store.get('task_list')||[];
        if (task_list.length) render_task_list();
        task_remind_check();
        console.log("initial successful");
        listen_msg_event();
    }
    function pop(arg) {
        if(!arg)
            console.error('pop title is requied!');
        var conf={}
            ,$box
            ,$mask
            ,$title
            ,$content
            ,$confirm
            ,$cancel
            ,timer
            ,dfd
            ,confirmed
            ;
        dfd = $.Deferred();
        if (typeof arg =='string')
            conf.title =arg;
        else{
            conf = $.extend(conf,arg);
        }
        $box =$('<div>' +
            '<div class="pop_title">' +
            conf.title +
            '</div>' +
            '<div class="pop_content">' +
            '<div>' +
            '<button style="margin-right: 15px;"  class="primary confirm">Enter</button>' +
            '<button class="cancel confirm">Cancel</button>' +
            '</div>' +
            '</div>' +
            '</div>')
            .css({
                color:'#333',
                width:300,
                height:'auto',
                padding:10,
                background:'#fff',
                position:'fixed',
                'border-radius':3,
                'box-shandow':'0 1px 2px rgba(0,0,0,.5)'
            });
        $box.find('.pop_title').css({
            padding:'5px 10px',
            'font-wight':900,
            'font-size':20,
            'text-align':'center'
        });
        $content= $box.find('.pop_content').css({
            padding:'5px 10px',
            'text-align':'center'
        });
        $confirm=$content.find('button.confirm');

        $cancel=$content.find('button.cancel');
        $mask =$('<div class="test"></div>')
            .css({
                position:'fixed',
                top:0,
                bottom:0,
                left:0,
                right:0,
                background:'rgba(0,0,0,.5)'
            });

        timer = setInterval(function () {
            if (confirmed!==undefined){
                dfd.resolve(confirmed);
                clearInterval(timer);
                dismiss_pop();
            }
        },50);
        $confirm.on('click',confirm_pop);
        $cancel.on('click',cancel_pop);
        $mask.on('click',cancel_pop);
        function cancel_pop () {
            confirmed = false;
        }
        function confirm_pop () {
            confirmed = true;
        }
        function dismiss_pop() {
            $mask.remove();
            $box.remove();
        }
        $window.on('resize',function () {
            adjust_box_position();
        });

        function adjust_box_position() {
            var window_width=$window.width()
                ,window_height=$window.height()
                ,box_height =$box.height()
                ,box_width = $box.width()
                ,move_x
                ,move_y
                ;
            move_x = (window_width-box_width)/2;
            move_y = (window_height-box_height)/2 - 20;
            $box.css({
                left:move_x,
                top:move_y
            });
            console.log(box_height,box_width,window_height,window_width)


        }

        $mask.appendTo($body);
        $box.appendTo($body);
        $window.resize();
        return dfd.promise();

    }


    $form_add_task.on('submit', on_add_task_from_submit);
    $task_detail_mask.on('click', hide_task_detail);
    

    
    function listen_msg_event() {
        $msg_confirm.on('click',function () {
            hide_msg();
        })
    }
    
    
    function on_add_task_from_submit(e) {
        //TODO:DEBUG
        $("button[name=clear]").hide();
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
        var index;
        var task_item=$('.task-item');
        task_item.on('dblclick',function () {
            //鼠标的双击事件
            index=$(this).data('index');
            show_task_detail(index);
        });
        task_item.mousedown(function(e){
            e.preventDefault();
            var $this = $(this);
            // var is_complete =$this.is(":checked");
            var index = $this.data('index');
            var item = get(index);
            if(3 == e.which){
                //监听鼠标右键的单击事件.
                e.preventDefault();
                if (item.complete){
                    update_task(index,{complete:false});
                    // $this.prop('checked',true)
                }
                else{
                    update_task(index,{complete:true});
                    // $this.prop('checked',false);
                }

            }
        });
        $task_detail_trigger.on("click",function () {
            var $this = $(this);
            var  $item = $this.parent().parent();
            index = $item.data('index');
           show_task_detail(index);
        })
    }
    
    function listen_checkbox_compete() {
        $checkbox_complete.on('click',function () {
            var $this = $(this);
            // var is_complete =$this.is(":checked");
            var index = $this.parent().parent().data('index');
            var item = get(index);
            if (item.complete){
                update_task(index,{complete:false});
                // $this.prop('checked',true)
            }
            else{
                update_task(index,{complete:true});
                // $this.prop('checked',false);
            }
        })
    }
    function get(index) {
        return store.get('task_list')[index];
    }
    //查看task_detail
    function show_task_detail(index) {
        render_task_detail(index);
        current_index=index;
        $task_detail.show();
        $task_detail_mask.show();

        // console.log($update_form);
        $update_form.on("submit",function (e) {
            e.preventDefault();
            var data ={};
            data.content = $(this).find('[name=content]').val();
            data.desc = $(this).find('[name=desc]').val();
            data.remind_date = $(this).find('[name=remind_date]').val();
            update_task(index,data);
            $task_detail.hide();
            $task_detail_mask.hide();
            // console.log(data);
            // console.log(index);
            // console.log(task_list);
        })
    }

    function update_task(index,data) {
        if(index===undefined||!task_list[index]) return;
        task_list[index] = $.extend({},task_list[index],data);

        refresh_task_list();
    }
    function hide_task_detail() {
        $task_detail.hide();
        $task_detail_mask.hide();
    }
    //查找并监听所有删除按钮的点击事件
    function listen_task_delete() {
        $task_delete_trigger.on("click",function () {
            var $this=$(this);
            var $item = $this.parent().parent();
            var index=$item.data('index');
            pop('R U Sure Delete?')
                .then(function (r) {
                    r ? delete_task(index):null;
                });
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
    function task_remind_check() {
        var current_timestap;
        var itl = setInterval(function () {
            for (var i=0;i<task_list.length;i++){
                var item =get(i),task_timestap;
                // console.log(item);
                if(!item||!item.remind_date||item.informed) continue;
                current_timestap =(new Date()).getTime();
                task_timestap = (new Date(item.remind_date)).getTime();
                // console.log('current_timestap'+':'+current_timestap);
                // console.log('task_timestap'+':'+task_timestap);
                if (current_timestap - task_timestap>=1){
                    update_task(i,{informed:true});
                    show_msg(item.content);
                }
            }
        },500);

    }
    function show_msg(msg) {
        if(!msg)return;//必须要有msg传入,不然通知是没有意义的
        $msg_content.html(msg);
        $alerter.get(0).play();
        $msg.show();
    }
    function hide_msg(msg) {
        $msg_content.html(msg);
        $msg.hide();
    }
    function render_task_list() {
        var $task_list=$('.task-list');
        $task_list.html('');
        for (var i=0;i<task_list.length;i++){
            var item =task_list[i];
            if (item && item.complete)
                complete_items[i]=item;
            else{
                var $task = render_task_item(item, i);
                $task_list.prepend($task);
            }

        }
        for (var j=0;j<complete_items.length;j++){
            $task =render_task_item(complete_items[j],j);
            if (!$task) continue;
            console.log("item"+item);
            console.log("complete_items"+j+":"+complete_items[j]);
            $task_list.append($task);
            $task.addClass('completed');

        }
        complete_items.length=0;

        /**
         *jQuery不会自动更新文档流，
         * 所以在生成条目的时候，
         * 需要手动去绑定事件。
         */
        $task_delete_trigger=$(".action.delete");
        $task_detail_trigger=$(".action.detail");
        $checkbox_complete = $('.task-list .complete[type=checkbox]');
        listen_task_delete();
        listen_task_detail();
        listen_checkbox_compete();

        
    }
    //渲染指定task——detail
    function render_task_detail(index) {
        if (index === undefined || !task_list[index])return;
        var item =task_list[index];
        var task_detail_tpl=
            '<form class="forms">'+
            '<div class="content">' +
            item.content +
            '</div>'+
            '<input style="display:none;" name="content" class="content" value="' +
            item.content+
            '"/>' +
            '<div>' +
            '<div class="desc input-item">' +
            '<textarea name="desc" id="">'+
            (item.desc||'')+
            '</textarea>' +
            '</div>' +
            '</div>' +
            '<div class="remind input-item">' +
            '<label for="">提醒时间</label>' +
            '<input class="datetime" type="text" name="remind_date" value="' +
            (item.remind_date || '') +
            '" />' +
            '</div>'+
            '<div class="input-item"><button type="submit" class="fr">Update</button></div>'+
            '</form>';
        //清空旧模板
        $task_detail.html("");
        //使用新模板代替旧模板
        $task_detail.html(task_detail_tpl);
        $(".datetime").datetimepicker();
        $update_form = $task_detail.find('form');
        $task_detail_content =$task_detail.find('[class=content]');
        $task_detail_content_input =$task_detail.find('[name=content]');
        //双击更改task——detail的标题
        $task_detail_content.on('dblclick',function () {
            $task_detail_content.hide();
            $task_detail_content_input.show();
        });

    }
    function render_task_item(data,index) {
        if (!data||index==undefined) return;
        var list_item_tpl=
            '<li class="task-item" data-index="' + index+'">'+
            '<span><input class="complete" type="checkbox" ' +
            (data.complete? 'checked':'')+
            ' ></span>'+
            '<span class="text-content">'+data.content+'</span>'+
            '<span class="fr">'+
            '<span class="action delete"> delete</span>'+
            '<span class="action detail"> detail</span>'+
            '<span>'+
            '</li>';
        return $(list_item_tpl);
    }

})();

