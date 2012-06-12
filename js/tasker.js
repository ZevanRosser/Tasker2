$(function() {

  var body = $("body"),
      doc = $(document),
      win = $(window),
      messages = {
      clearAll: "Are you sure you want to clear all your task lists?",
      removeTaskList: "Are you sure you want to remove this task list?",
      removeTask: "Are you sure you want to remove this task?"
      },
      tasker = new Tasker();

  win.on("resize arrange", function() {
    var scroll = win.scrollTop(),
        taskListContainer = $("#task-container"),
        taskLists = $("#task-container .task-list"),
        size = taskLists.eq(0).outerWidth() + 5,
        num = taskLists.length,
        winWidth = win.width(),
        cols = Math.floor(winWidth / size),
        margin = 5,
        top = 20;

    taskLists.css({
      left: (winWidth - (cols * size)) / 2 - 5,
      top: top
    });

    for (var i = 1; i < num; i++) {
      var pre = taskLists.eq(i - 1);
      var curr = taskLists.eq(i);
      var prePos = pre.position();
      curr.css({
        top: top,
        left: prePos.left + pre.outerWidth() + margin
      });

      if (i >= cols) {
        var above = taskLists.eq(i - cols);
        var abovePos = above.position();
        curr.css({
          left: abovePos.left,
          top: abovePos.top + above.outerHeight() + margin
        });
      }
    }
    if (curr) {
      taskListContainer.css({
        height: curr.position().top + curr.height()
      });
    }

    win.scrollTop(scroll);
  }).trigger("arrange");

  function Tasker() {
    var self = this;
    self.elem = $("#main-ui").selectAll(self).appendTo(body);

    FileSaver.project("tasker");
    FileSaver.begin(function(content){
      
      self.taskContainer.html(content);
    });

    function updateClearAll() {
      if (self.taskContainer.html() == "") {
        self.clearAll.prop("disabled", true);
      } else {
        self.clearAll.prop("disabled", false);
      }
    }
    updateClearAll();

    function update() {
      win.trigger("arrange");
      updateClearAll();
    }

    update();

    self.save = function() {
      update();
    };
     
    self.saveBtn.click(function(){
      body.css({opacity : 0.5});
      $("<div>", {
        css : {
          position : "absolute",
          top : 0, left : 0,
          width : win.width(),
          height : win.height(),
          backgroundColor : "black",
          opacity : 0.3,
          zIndex : 100 
        }
      }).appendTo(body);
      FileSaver.save(self.taskContainer.html());
    });

    self.clearAll.click(function() {
      if (confirm(messages.clearAll)) {
        localStorage.tasker = "";
        self.taskContainer.html("");
        self.update();
      }
    });

    self.addForm.submit(function(e) {
      e.preventDefault();
      var value = $.trim(self.title.val());
      if (value.length == 0) return;
      var taskList = new TaskList(value);
      self.title.val("");
      taskList.elem.prependTo(self.taskContainer);
      win.trigger("arrange");
      self.save();
      taskList.newTask.focus();
    });
  };

  function TaskList(title) {
    this.elem = $("#task-list").selectAll(this);
    this.title.text(title);
  };
  doc.on("submit", ".add-form", function(e) {
    e.preventDefault();
    var curr = $(this),
        parent = curr.parent(),
        container = parent.find(".tasks"),
        text = curr.find(".new-task"),
        value = $.trim(text.val());
    if (value.length == 0) return;

    var task = new Task(value);
    task.elem.appendTo(container);
    task.check.trigger("evalchecks");
    text.val("");
    parent.removeClass("complete");
    tasker.save();
  }).on("click", ".close", function() {
    if (confirm(messages.removeTaskList)) {
      $(this).parent().remove();
      tasker.save();
    }
  }).on("click", ".title", function() {
    var curr = $(this);
    var newTitle = prompt("Rename task '" + curr.text() + "' to:");
    if (newTitle) {
      curr.text(newTitle);
      tasker.save();
    }
  });

  function Task(text) {
    this.elem = $("#task").selectAll(this);
    this.text.text(text);
  };
  doc.on("click evalchecks", ".check", function() {
    var curr = $(this),
        tasks = curr.parent().parent(),
        taskList = tasks.parent();
    evalChecks(tasks, taskList);
  }).on("click", ".little-btn", function() {
    if (confirm(messages.removeTask)) {
      var task = $(this).parent(),
          tasks = task.parent(), 
          taskList = tasks.parent();
      task.remove();
      evalChecks(tasks, taskList);
    }
  });

  function evalChecks(parent, taskList) {
    var bar = taskList.find(".bar"),
        well = taskList.find(".well"),
        feedback = taskList.find(".feedback"),
        checks = parent.find(".check"),
        checkNum = checks.length,
        checked = 0;
    taskList.removeClass("complete");
    checks.each(function() {
      var check = $(this);
      if (check.prop("checked")) {
        checked++;
        check.attr("checked", true);
      } else {
        check.attr("checked", false);
      }
      if (checked == checkNum) {
        taskList.addClass("complete");
      }
    });
    feedback.text(checked + "/" + checkNum + " completed");
    well.css({
      width: (checked / checkNum) * bar.width()
    });
    tasker.save();
  }


});