/* Setup blank page controller */
angular.module('RTM').controller('LogviewController', ['$rootScope', '$scope', 'settings', function($rootScope, $scope, settings) {
  $scope.$on('$viewContentLoaded', function() {
    console.log('#### Build Log Overlay init')
  });

  var actionNotifications = [];

  function openSocket() {
    if ("WebSocket" in window) {
      if (typeof($rootScope.wss) == "undefined") {
        // open websocket
        console.log('## Opening websocket with credentials ##');
        $rootScope.wss = new WebSocket("wss://rtm.thinx.cloud:7444/" + $rootScope.profile.owner);

        $rootScope.wss.onopen = function() {
          console.log("## Websocket connection estabilished ##");

          if (typeof($rootScope.modalBuildId) !== "undefined") {
            $rootScope.wsstailLog($rootScope.modalBuildId);
          } else {
            $rootScope.wssinit();
          }
        };
        $rootScope.wss.onmessage = function (message) {
          console.log("-> ", message.data);

          // quick check before parsing
          var msgType = message.data.substr(2, 12);
          if (msgType == "notification") {

            parseNotification(message.data);

          } else {
            // save build data to build buffer
            if (typeof($rootScope.modalBuildId) !== "undefined") {
              $rootScope.logdata[$rootScope.modalBuildId] = $rootScope.logdata[$rootScope.modalBuildId] + "\n" + message.data;
            }
            $rootScope.logdata.buffer = $rootScope.logdata.buffer + "\n" + message.data;
          }
        };
        $rootScope.wss.onclose = function() {
          console.log("## Websocket connection is closed... ##");
        };
      } else {
        // websocket already open
        console.log("## Websocket status:", $rootScope.wss.readyState, " ##");
      }
    } else {
      // The browser doesn't support WebSocket
      toastr.error("Error", "WebSocket NOT supported by your Browser!", {timeOut: 5000})
    }
  }

  // Open websocket to for log & notifications transfer
  console.log('##### websocket init')
  openSocket();

  if (typeof($rootScope.showLogOverlayListener) == "undefined") {
    $rootScope.showLogOverlayListener = $rootScope.$on('showLogOverlay', function(event, build_id){

      console.log('firetwice event');
      console.log(event);

        event.stopPropagation();
        $rootScope.showLog(build_id);
    });
  }

  $rootScope.wsstailLog = function(build_id) {
    console.log('-- refreshing log: ', build_id)
    var message = {
      logtail: {
        owner_id: $rootScope.profile.owner,
        build_id: build_id
      }
    }
    // $rootScope.logdata.buffer[$rootScope.modalBuildId] = "";
    $rootScope.logdata[build_id] = "";
    $rootScope.modalBuildId = build_id;
    $rootScope.wss.send(JSON.stringify(message));
  }

  $rootScope.wssinit = function() {
    console.log('-- initializing websocket ')
    var message = {
      init: $rootScope.profile.owner
    }
    $rootScope.wss.send(JSON.stringify(message));
  }

  $rootScope.hideLogOverlay = function(build_id) {
    console.log('--- hiding log overlay --- ');
    $('.log-view-overlay-conatiner').fadeOut();
    console.log($rootScope.logdata.watchers[build_id]);
    clearInterval($rootScope.logdata.watchers[build_id]);
  }


  $rootScope.showLog = function(build_id) {

    console.log('--[ logdata ]-- ');
    console.log($rootScope.logdata);
    console.log('--- opening log for build_id: ' + build_id, ' ---');
    $('.log-view-overlay-conatiner').fadeIn();

    // start auto refresh
    console.log('--- starting refresh timer --- ');
    $rootScope.logdata.watchers[build_id] = setInterval(function(){
      console.log('Refreshing log view...');
      $rootScope.$digest();
    }, 500);

    $rootScope.modalBuildId = build_id;

    if (typeof($rootScope.wss) !== "undefined") {
      console.log('Socket ready, tailing log...');
      $rootScope.wsstailLog(build_id);
    } else {
      console.log('Socket not ready, trying to open it...')
      openSocket();
    }
  }

  $rootScope.switchWrap = function() {
    console.log('--- toggle word-wrap --- ');
    $('.log-view-body').toggleClass('force-word-wrap');
    $('.icon-frame').toggleClass('overlay-highlight');
  }

  /*
    $scope.unwatchLog = function(build_id) {
      console.log('-- unwatching log: ', build_id)
      var message = {
        unwatch: {
          owner_id: $rootScope.profile.owner,
          build_id: build_id
        }
      }
      $rootScope.ws.send(JSON.stringify(message));
    }
  */

  $scope.toastrCancel = function() {
    alert('test');
  }

  function parseNotification(data) {
    var msgBody = JSON.parse(data);
    var msg = msgBody.notification;

    // determine what to do based on message type
    if (typeof(msg.type) !== "undefined") {

      if (msg.type == "actionable") {

          // show toast with dialog

          if (msg.response_type == 'bool') {

            // YES/NO

            var formToast = toastr['info'](
              msg.body + "<br><br>" +
              msg.nid + "<br><br>" +
              '<div><button type="button" id="okBtn-' + msg.nid +
              '" class="btn btn-success toastr-ok-btn">Yes</button>' +
              '<button type="button" id="cancelBtn-' + msg.nid +
              '" class="btn btn-danger toastr-cancel-btn" style="margin: 0 8px 0 8px">No</button></div>',
              msg.title,
              {
                timeOut:0,
                extendedTimeOut:0,
                tapToDismiss: false,
                closeButton: true,
                closeMethod: 'fadeOut',
                closeDuration: 300,
                closeEasing: 'swing'
              }
            );

            $('#okBtn-' + msg.nid).on("click", function(e){
              $(this).parent().slideToggle(500);
              $scope.$emit("submitNotificationResponse", true);
            });

            $('#cancelBtn-' + msg.nid).on("click", function(e){
              $(this).parent().slideToggle(500);
              $scope.$emit("submitNotificationResponse", false);
            });
          }

          if (msg.response_type == 'string') {

            // INPUT string

            var formToast = toastr['warning'](
              msg.body + "<br><br>" +
              msg.nid + "<br><br>" +
              '<div><input class="toastr-input" name="reply-' + msg.nid + '" value=""/></div><br>' +
              '<div><button type="button" id="sendBtn-' + msg.nid +
              '" class="btn btn-success toastr-send-btn">Send</button></div>',
              msg.title,
              {
                timeOut:0,
                extendedTimeOut:0,
                tapToDismiss: false,
                closeButton: true,
                closeMethod: 'fadeOut',
                closeDuration: 300,
                closeEasing: 'swing'
              }
            );

            $('#sendBtn-' + msg.nid).on("click", function(e){
              $(this).parent().slideToggle(500);
              $scope.$emit("submitNotificationResponse", $('input[name=reply-' + msg.nid + ']').val());
            });

          };

        } else if (typeof(msg.body.status) !== 'undefined') {

          // process status message and reload devices

          toastr[msg.type](
            JSON.stringify(msg.body),
            'Device Status Update',
            {
              timeOut: 6000,
              tapToDismiss: true,
              closeButton: true,
              closeMethod: 'fadeOut',
              closeDuration: 300,
              closeEasing: 'swing',
              progressBar: true
            }
          );

          $scope.$apply(function(){
            Thinx.deviceList().done(function(data) {
              $scope.$emit("updateDevices", data);
            })
            .fail(error => $scope.$emit("xhrFailed", error));
          });


        } else {

          // default notification

          toastr[msg.type](JSON.stringify(msg.body), msg.title, {
            progressBar: true,
            closeButton: true,
            closeMethod: 'fadeOut',
            closeDuration: 300,
            closeEasing: 'swing'
          });

        }

      }
    }

}]);
