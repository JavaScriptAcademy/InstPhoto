var ref = new Firebase("https://blistering-heat-1061.firebaseio.com");

var postsRef = ref.child('posts');
var usersRef = ref.child("users");

var currentlyId;
ref.onAuth(function(authData) {
  if(authData){
    currentlyId = authData.uid;
  }
});

function preCreateHomePost(key, snapshot, posts, $scope) {
  var userRef = usersRef.child(currentlyId);
  userRef.on('value', function(userSnapshot) {

    var postUserid = snapshot.val()[key].userid;
    for(var index = 0; index < userSnapshot.val().followed.length; index++){
      if(userSnapshot.val().followed[index] === postUserid ||
        currentlyId === postUserid) {
        posts[key] = snapshot.val()[key];
        $scope.noposts = false;
      }
    }
  });
}

function createHomePost(key, $scope, newPosts) {
  var userRef = usersRef.child(newPosts[key].userid);
  userRef.on('value', function(snapshot) {
    newPosts[key].username = snapshot.val().username;
    newPosts[key].photo = snapshot.val().photo;
    // console.log($scope.posts);
    $scope.posts = newPosts;
    for(var post in $scope.posts){
      for(var i = 0; i < $scope.posts[post].like.length; i++){
        if($scope.posts[post].like[i] == currentlyId){
          $scope.posts[post].islike = true;
        }
      }
      if($scope.posts[post].comment){
        var comment = $scope.posts[post].comment;
        var lastComment = comment[Object.keys(comment)[Object.keys(comment).length - 1]];
        var userRef = usersRef.child(lastComment.userId)
        userRef.once("value", function(snapshot){
          $scope.posts[post].lastcommentUser = snapshot.val().username;
        })
        $scope.posts[post].lastcommentContent = lastComment.content;
        if(Object.keys(comment).length > 1){
          var sLastComment = comment[Object.keys(comment)[Object.keys(comment).length - 2]];
          var userRef = usersRef.child(sLastComment.userId)
          userRef.once("value", function(snapshot){
            $scope.posts[post].sLastcommentUser = snapshot.val().username;
          })
          $scope.posts[post].sLastcommentContent = sLastComment.content;
        }
      }
      //  console.log($scope.posts);
    }

  }, function(errorObject) {
    console.log("The read failed: " + errorObject.code);
  });
}

angular.module('app.controllers', [])
.controller('homeCtrl', function($scope, $state, $window) {
  //$scope.posts = [];
  $scope.noposts = true;




  postsRef.on("value", function(snapshot) {
    $scope.moment = moment;
    var posts = {};
    for(var key in snapshot.val()){
      preCreateHomePost(key, snapshot, posts, $scope);
    }





    var newPosts = {};
    reverseForIn(posts, function(key){
     newPosts[key] = this[key];
    });

    for(var key in newPosts){
      createHomePost(key, $scope, newPosts);
    }

    //$scope.$apply();
  }, function (errorObject) {
    console.log("The read failed: " + errorObject.code);
  });

  $scope.commentsPage = function(postid) {
    $state.go('comments', {
      postid: postid
    });
  }

  $scope.detail = function(userid) {
    $state.go('user', {
      userid: userid
    });
  }

  $scope.submitComment = function($event, key){
    if($event.keyCode == 13){
      var content = $event.target.value;
      var postRef = postsRef.child(key);
      postRef.child('comment').push().set({
        userId: currentlyId,
        content: content
      })
      $event.target.value = '';
      // $scope.commentInput = false;
    }
  };

  $scope.matchedUsers = [];
  $scope.matchUser = function($event) {
    var keyWord = $event.target.value;
    if(keyWord != null && keyWord != ''){
      var match = new RegExp(keyWord, "i");
      var matchUsers = [];
      usersRef.once("value", function(snapshot){
        var users = snapshot.val();
        for(var user in users){
          if(users[user].username.match(match)){
            users[user].userid = user;
            matchUsers.push(users[user]);
          }
        }
        $scope.matchedUsers = matchUsers;
        $scope.$apply();
      })
    }else{
      $scope.matchedUsers = [];
    }
  }

  $scope.getLength = function(obj) {
      return Object.keys(obj).length;
  }

  $scope.showLike = showLike;
  $scope.like = likePhoto;
})

.controller('userCtrl', function($scope, $stateParams, $state) {
  $scope.userdata = {};
  if($stateParams.userid === currentlyId) {
    $scope.isCurUserItself = true;
  }
  var userRef = usersRef.child($stateParams.userid);
  userRef.on("value", function(snapshot) {
    $scope.userdata.username = snapshot.val().username;
    $scope.userdata.photo = snapshot.val().photo;

    ref.onAuth(function(authData) {
      $scope.isfollowed = false;
      for(var index = 0; index < snapshot.val().follower.length-1; index++){
        if(snapshot.val().follower[index] === currentlyId){
          $scope.isfollowed = true;
        }
      }
    });
    $scope.userdata.follower = snapshot.val().follower.length-1;
    $scope.userdata.followed = snapshot.val().followed.length-1;

  }, function (errorObject) {
    console.log("The read failed: " + errorObject.code);
  });

  postsRef.on("value", function(snapshot) {
    var newPosts = {};
    reverseForIn(snapshot.val(), function(key){
      newPosts[key] = this[key];
    });
    $scope.userdata.posts = {};
    for(var key in newPosts) {
      if(newPosts[key].userid === $stateParams.userid){
        $scope.userdata.posts[key] = newPosts[key];
      }
    }

    var postsNum = 0;
    for(var post in $scope.userdata.posts){
      postsNum++;
      for(var i = 0; i < $scope.userdata.posts[post].like.length; i++){
        if($scope.userdata.posts[post].like[i] === currentlyId){
          $scope.userdata.posts[post].islike = true;
        }
      }
    }
    $scope.userdata.postsNum = postsNum;
  }, function (errorObject) {
    console.log("The read failed: " + errorObject.code);
  });

  $scope.showLike = showLike;
  $scope.like = likePhoto;
  $scope.follow = function() {
    console.log('follow func');
    var userToBeFollowedRef = usersRef.child($stateParams.userid);
    userToBeFollowedRef.once("value", function(snapshot) {
      var follower = snapshot.val().follower;
      var email = snapshot.val().email;
      var username = snapshot.val().username;
      var photo = snapshot.val().photo;
      var followed = snapshot.val().followed;
      follower.unshift(currentlyId);
      userToBeFollowedRef.set({
        username: username,
        email: email,
        photo: photo,
        follower: follower,
        followed: followed
      });
    });

    var userRef = usersRef.child(currentlyId);
    userRef.once("value", function(snapshot) {
      var follower = snapshot.val().follower;
      var email = snapshot.val().email;
      var username = snapshot.val().username;
      var photo = snapshot.val().photo;
      var followed = snapshot.val().followed;
      followed.unshift($stateParams.userid);
      userRef.set({
        username: username,
        email: email,
        photo: photo,
        follower: follower,
        followed: followed
      });
    });
    $scope.isfollowed = true;
    console.log('end');
  }

  $scope.unfollow = function() {
    console.log('unfollow func');

    var userRef = usersRef.child(currentlyId);
    userRef.once("value", function(snapshot) {
      var follower = snapshot.val().follower;
      var email = snapshot.val().email;
      var username = snapshot.val().username;
      var photo = snapshot.val().photo;
      var followed = snapshot.val().followed;
      for(var index = 0; index < followed.length-1; index++){
        if(followed[index] === $stateParams.userid){
          followed.splice(index, 1);
          console.log('remove in followed');
        }
      }
      userRef.set({
        username: username,
        email: email,
        photo: photo,
        follower: follower,
        followed: followed
      });
    });


    var userToBeFollowedRef = usersRef.child($stateParams.userid);
    userToBeFollowedRef.once("value", function(snapshot) {
      var follower = snapshot.val().follower;
      var email = snapshot.val().email;
      var username = snapshot.val().username;
      var photo = snapshot.val().photo;
      var followed = snapshot.val().followed;
      for(var index = 0; index < follower.length-1; index++){
        if(follower[index] === currentlyId){
          follower.splice(index, 1);
          console.log('remove in follower');
        }
      }

      userToBeFollowedRef.set({
        username: username,
        email: email,
        photo: photo,
        follower: follower,
        followed: followed
      });
    });
    $scope.isfollowed = false;

    console.log('end');
  }

  $scope.followedDetail = function() {
    $state.go('follow', {
      from: 'user',
      type: 'followed',
      userid: $stateParams.userid
    });
  }
    $scope.followerDetail = function() {
    console.log('test');
    $state.go('follow', {
      from: 'user',
      type: 'follower',
      userid: $stateParams.userid
    });
  }

  $scope.getLength = function(obj) {
    return Object.keys(obj).length;
  }

  $scope.commentsPage = function(postid) {
    $state.go('comments', {
      postid: postid
    });
  }
})

.controller('currentlyUserCtrl', function($scope, $state, $ionicActionSheet) {
  $scope.userdata = {};

  $scope.goSetting = function() {
    $state.go('setting');
  };

  $scope.getLength = function(obj) {
    return Object.keys(obj).length;
  }

  $scope.commentsPage = function(postid) {
    $state.go('comments', {
      postid: postid
    });
  }

  ref.onAuth(function(authData) {

    var currentlyId = authData.uid;
    var userRef = usersRef.child(currentlyId);

    userRef.on("value", function(snapshot) {
      console.log(snapshot.val());
      $scope.userdata.username = snapshot.val().username;
      $scope.userdata.photo = snapshot.val().photo;
      $scope.userdata.follower = snapshot.val().follower.length-1;
      $scope.userdata.followed = snapshot.val().followed.length-1;

    }, function (errorObject) {
      console.log("The read failed: " + errorObject.code);
    });

    postsRef.on("value", function(snapshot) {
      var newPosts = {};
      reverseForIn(snapshot.val(), function(key){
        newPosts[key] = this[key];
      });
      $scope.userdata.posts = {};
      for(var key in newPosts) {
        if(newPosts[key].userid === currentlyId){
          $scope.userdata.posts[key] = newPosts[key];
        }
      }
      var postsNum = 0;
      for(var post in $scope.userdata.posts){
        postsNum++;
        for(var i = 0; i < $scope.userdata.posts[post].like.length; i++){
          if($scope.userdata.posts[post].like[i] === currentlyId){
            $scope.userdata.posts[post].islike = true;
          }
        }
      }
      $scope.userdata.postsNum = postsNum;
    }, function (errorObject) {
      console.log("The read failed: " + errorObject.code);
    });
  });

  $scope.showLike = showLike;
  $scope.like = likePhoto;

  $scope.delete = function(postid) {
    var hideSheet = $ionicActionSheet.show({
     buttons: [
       { text: '<b>DELETE</b>' }
     ],
     titleText: 'Delete the post',
     cancelText: 'Cancel',
     cancel: function() {
          // add cancel code..
        },
     buttonClicked: function(index) {
      if(index === 0){
        console.log('delete !');
        console.log(postid);
        var postRef = postsRef.child(postid);
        postRef.set(null);
       return true;
      }
     }
   });


  }

  $scope.followerDetail = function() {
    console.log('test');
    $state.go('follow', {
      from: 'curUser',
      type: 'follower',
      userid: currentlyId
    });
  }

  $scope.followedDetail = function() {
    console.log('test1');

    $state.go('follow', {
      from: 'curUser',
      type: 'followed',
      userid: currentlyId
    });
  }
})

.controller('signupCtrl', function($scope, $state, $ionicLoading) {
  $scope.signupForm = {};
  $scope.submit = function() {

    $ionicLoading.show({
      template: '<ion-spinner icon="bubbles"></ion-spinner>'
    });

    ref.createUser({
      email    : $scope.signupForm.email,
      password : $scope.signupForm.password
    }, function(error, userData) {
      if (error) {
        $scope.signupForm.msg = true;
        console.log("Error creating user:", error);
        $scope.$apply();
        $ionicLoading.hide();
      } else {
        $scope.signupForm.msg = false;
        console.log("Successfully created user account with uid:", userData.uid);
        var username = $scope.signupForm.username;
        var email = $scope.signupForm.email;
        var follower = [''];
        var followed = [''];
        usersRef.child(userData.uid).set({
          username: username,
          email: email,
          follower: follower,
          followed: followed,
          photo: 'data:image/jpeg;base64,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'
        });

        $ionicLoading.hide();
        $scope.signupForm.password = '';
        $scope.signupForm.email = '';
        $scope.signupForm.username = '';
        $state.go('login');
      }
    });
  }
})

.controller('loginCtrl', function($scope, $state, $ionicLoading) {
  $scope.signinForm = {};
  $scope.submit = function() {

    $ionicLoading.show({
      template: '<ion-spinner icon="bubbles"></ion-spinner>'
    });

    ref.authWithPassword({
      email    : $scope.signinForm.email,
      password : $scope.signinForm.password
    }, function(error, authData) {
      if (error) {
        $scope.signinForm.msg = true;
        console.log("Login Failed!", error);
        $scope.$apply();
        $ionicLoading.hide();
      } else {
        $scope.signinForm.msg = false;
        console.log("Authenticated successfully with payload:", authData);
        $ionicLoading.hide();
        $scope.signinForm.password = '';
        $scope.signinForm.email = '';
        $state.go('tabsController.home');

      }
    }, {
      remember: "sessionOnly"
    });
  }
})

.controller('editPostCtrl', function($scope) {
})

.controller('followCtrl', function($scope, $stateParams, $state) {
  var follow = {};
  var userRef = usersRef.child($stateParams.userid);
  userRef.on('value', function(snapshot) {
    for(var index = 0; index < snapshot.val()[$stateParams.type].length-1; index++) {
      createFollow(index, snapshot, $scope, $stateParams, follow);
    }
  });

  $scope.detail = function(userid) {
    $state.go('user', {
      userid: userid
    });
  }

  $scope.back = function() {
    if($stateParams.from === 'user'){
      $state.go('user', {
        userid: $stateParams.userid
      });
    } else {
      $state.go('tabsController.currentlyUser');
    }
  }
})

.controller("cameraController", function ($scope, $cordovaCamera, $state) {
  $scope.takePhoto  = function () {
    $scope.imgURI = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD//gBraHR0cDovL3dlYnJlc2l6ZXIuY29tIGJzOjAgYmM6IzAwMDAwMCBwczowIHBjOiNlZWVlZWUgZXM6MCBlYzojMDAwMDAwIGNrOmRiM2RlNjA3YjQyZmIyOTIwZjQ5MDg0OTM4YmE1NTFl/+0RFFBob3Rvc2hvcCAzLjAAOEJJTQPtAAAAAAAQAEgAAAABAAEASAAAAAEAAThCSU0EDQAAAAAABAAAAB44QklNBBkAAAAAAAQAAAAeOEJJTQPzAAAAAAAJAAAAAAAAAAABADhCSU0ECgAAAAAAAQAAOEJJTScQAAAAAAAKAAEAAAAAAAAAAjhCSU0D9QAAAAAASAAvZmYAAQBsZmYABgAAAAAAAQAvZmYAAQChmZoABgAAAAAAAQAyAAAAAQBaAAAABgAAAAAAAQA1AAAAAQAtAAAABgAAAAAAAThCSU0D+AAAAAAAcAAA/////////////////////////////wPoAAAAAP////////////////////////////8D6AAAAAD/////////////////////////////A+gAAAAA/////////////////////////////wPoAAA4QklNBAgAAAAAABAAAAABAAACQAAAAkAAAAAAOEJJTQQeAAAAAAAEAAAAADhCSU0EGgAAAAAAhQAAAAYAAAAAAAAAAAAAAdUAAAGQAAAAEgBQAHIAZQBzAGIAeQB0AGUAcgBpAGEAbgBDAGgAdQByAGMAaAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAABkAAAAdUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOEJJTQQRAAAAAAABAQA4QklNBBQAAAAAAAQAAAABOEJJTQQMAAAAAA44AAAAAQAAAGAAAABwAAABIAAAfgAAAA4cABgAAf/Y/+AAEEpGSUYAAQIBAEgASAAA/+4ADkFkb2JlAGSAAAAAAf/bAIQADAgICAkIDAkJDBELCgsRFQ8MDA8VGBMTFRMTGBEMDAwMDAwRDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAENCwsNDg0QDg4QFA4ODhQUDg4ODhQRDAwMDAwREQwMDAwMDBEMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwM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';
    //   var options = {
    //     quality: 75,
    //     destinationType: Camera.DestinationType.DATA_URL,
    //     sourceType: Camera.PictureSourceType.PHOTOLIBRARY,
    //     allowEdit: true,
    //     encodingType: Camera.EncodingType.JPEG,
    //     targetWidth: 300,
    //     targetHeight: 300,
    //     popoverOptions: CameraPopoverOptions,
    //     saveToPhotoAlbum: false
    // };
    //     $cordovaCamera.getPicture(options).then(function (imageData) {
    //         $scope.imgURI = "data:image/jpeg;base64," + imageData;
    //     }, function (err) {
    //         // An error occured. Show a message to the user
    //     });
  }
  $scope.choosePhoto = function () {
    $scope.imgURI = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAAAAAAAD/7gAOQWRvYmUAZAAAAAAB/+EAFkV4aWYAAE1NACoAAAAIAAAAAAAA/+wAEUR1Y2t5AAEABAAAADwAAP/hA5JodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+DQo8eDp4bXBtZXRhIHhtbG5zOng9ImFkb2JlOm5zOm1ldGEvIiB4OnhtcHRrPSJBZG9iZSBYTVAgQ29yZSA1LjYtYzAxNCA3OS4xNTY3OTcsIDIwMTQvMDgvMjAtMDk6NTM6MDIgICAgICAgICI+DQoJPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4NCgkJPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDpiMGZlOGZiZi0wMTA2LTRkYjEtYmFiNS0yMzA4YTA5ZTNkMmUiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6MDg2RkY1NTEwNjE0MTFFNUJFQzY4NkY1QUE2RDhCRjgiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6MDg2RkY1NTAwNjE0MTFFNUJFQzY4NkY1QUE2RDhCRjgiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTQgKE1hY2ludG9zaCkiPg0KCQkJPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6YjBmZThmYmYtMDEwNi00ZGIxLWJhYjUtMjMwOGEwOWUzZDJlIiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOmIwZmU4ZmJmLTAxMDYt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';
    //   var options = {
    //     quality: 75,
    //     destinationType: Camera.DestinationType.DATA_URL,
    //     sourceType: Camera.PictureSourceType.PHOTOLIBRARY,
    //     allowEdit: true,
    //     encodingType: Camera.EncodingType.JPEG,
    //     targetWidth: 300,
    //     targetHeight: 300,
    //     popoverOptions: CameraPopoverOptions,
    //     saveToPhotoAlbum: false
    // };
    //     $cordovaCamera.getPicture(options).then(function (imageData) {
    //         $scope.imgURI = "data:image/jpeg;base64," + imageData;
    //     }, function (err) {
    //         // An error occured. Show a message to the user
    //     });

  }

  $scope.submit = function(imageURI) {
    console.log("submit");
    postsRef.push().set({
      userid: currentlyId,
      imagePath: imageURI,
      createdAt:getCurrentDate(),
      imageEffect: "",
      context: $scope.comment,
      like: ['']
    });
    $scope.imgURI=undefined;
    $scope.comment="";
    $state.go('tabsController.home');
  }

  $scope.cancle = function(imageURI) {
    console.log("cancle");
    $scope.imgURI=undefined;
    $scope.comment="";
    $state.go('tabsController.home');

  }

  $scope.surprise = function(imageURI) {
    console.log("surprise");
    console.log(randomEffect());
    postsRef.push().set({
      userid: currentlyId,
      imagePath: imageURI,
      createdAt:getCurrentDate(),
      context: $scope.comment,
      imageEffect:randomEffect(),
      like: ['']
    });
    $scope.imgURI=undefined;
    $scope.comment="";
    $state.go('tabsController.home');

  }

})

.controller('accountSettingCtrl', function($scope, $state) {
  $scope.edit = function() {
    ref.onAuth(function(authData) {
      if (authData) {
        console.log("Authenticated with uid:", authData.uid);
      } else {
        console.log("Client unauthenticated.")
      }
    });
  }
  $scope.logout = function() {
    $state.go('login');
    ref.unauth();
  };
  $scope.changePhoto = function() {
    $state.go('portrait');
  }
})

.controller('portraitCtrl', function($scope, $cordovaCamera, $state) {
    $scope.takePhoto = function () {
      $scope.imgURI = 'data:image/jpeg;base64,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';
    //   var options = {
    //     quality: 75,
    //     destinationType: Camera.DestinationType.DATA_URL,
    //     sourceType: Camera.PictureSourceType.CAMERA,
    //     allowEdit: true,
    //     encodingType: Camera.EncodingType.JPEG,
    //     targetWidth: 300,
    //     targetHeight: 300,
    //     popoverOptions: CameraPopoverOptions,
    //     saveToPhotoAlbum: false
    // };
    //     $cordovaCamera.getPicture(options).then(function (imageData) {
    //         $scope.imgURI = "data:image/jpeg;base64," + imageData;
    //     }, function (err) {
    //         // An error occured. Show a message to the user
    //     });
    }
    $scope.choosePhoto = function () {
      $scope.imgURI = 'data:image/jpeg;base64,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'
      //   var options = {
      //     quality: 75,
      //     destinationType: Camera.DestinationType.DATA_URL,
      //     sourceType: Camera.PictureSourceType.PHOTOLIBRARY,
      //     allowEdit: true,
      //     encodingType: Camera.EncodingType.JPEG,
      //     targetWidth: 300,
      //     targetHeight: 300,
      //     popoverOptions: CameraPopoverOptions,
      //     saveToPhotoAlbum: false
      // };
      //     $cordovaCamera.getPicture(options).then(function (imageData) {
      //         $scope.imgURI = "data:image/jpeg;base64," + imageData;
      //     }, function (err) {
      //         // An error occured. Show a message to the user
      //     });
    }

    $scope.submit = function(imageURI) {
      console.log('submit');
      console.log('in auth');
      var userRef = usersRef.child(currentlyId);
      var username;
      var email;
      var follower;
      var followed;
      userRef.once('value', function(snapshot) {
        console.log(snapshot.val());
        username = snapshot.val().username;
        email = snapshot.val().email;
        console.log(email);
        followed = snapshot.val().followed;
        follower = snapshot.val().follower;
        userRef.set({
          email: email,
          photo: imageURI,
          username: username,
          follower: follower,
          followed: followed
        });
      }, function (errorObject) {
      console.log("The read failed: " + errorObject.code);
      });

      $state.go('tabsController.currentlyUser');
    }

    $scope.cancle = function() {
      $scope.imgURI=undefined;
      $state.go('tabsController.home');
    }

})

.controller('commentsCtrl', function($scope, $stateParams, $state) {
  var postid = $stateParams.postid;
  var postRef = postsRef.child(postid);
  postRef.on('value', function(postSnapshot) {
    var commentTemp = postSnapshot.val().comment;
    for(var key in commentTemp){
      createComment(key, commentTemp);
    }

    var comments = {};
    reverseForIn(commentTemp, function(key){
      comments[key] = this[key];
    });
    console.log(comments);
    $scope.comments = comments;
  }, function (errorObject) {
    console.log("The read failed: " + errorObject.code);
  });

  $scope.detail = function(userid) {
    $state.go('user', {
      userid: userid
    });
  }

})

function getCurrentDate() {
  var date  = new Date().getTime();
  return date;
}

function getDateString(date) {
    var month = date.getUTCMonth() + 1; //months from 1-12
    var day = date.getUTCDate();
    var year = date.getUTCFullYear();
    var hour = date.getHours(); // => 9
    var minute = date.getMinutes(); // =>  30
    var newDate = year + "/" + month + "/" + day + "   ";
    var newTime = hour + ":" + minute ;
    return newDate + newTime;
}

function reverseForIn(obj, f) {
  var arr = [];
  for (var key in obj) {
    // add hasOwnPropertyCheck if needed
    arr.push(key);
  }
  for (var i=arr.length-1; i>=0; i--) {
    f.call(obj, arr[i]);
  }
}

var showLike = function(post) {
  return post.like.length !== 1;
}

var likePhoto = function(key){
    var postRef = ref.child('posts/' + key);
    postRef.once('value', function(snapshot){
      var like = snapshot.val().like;
      var flag = false;
      for(var i = 0; i < like.length-1; i++){
        if(like[i] === currentlyId){
          flag = true;
          like.splice(i, 1);
        }
      }
      if(flag){
        postRef.set({
          userid:snapshot.val().userid ,
          //username: snapshot.val().username,
          imagePath: snapshot.val().imagePath,
          createdAt: snapshot.val().createdAt,
          context: snapshot.val().context,
          imageEffect: snapshot.val().imageEffect,
          like: like,
          //comment: snapshot.val().comment
        })
      }else{
        like.unshift(currentlyId);
        postRef.set({
          userid:snapshot.val().userid ,
          //username: snapshot.val().username,
          imagePath: snapshot.val().imagePath,
          createdAt: snapshot.val().createdAt,
          context: snapshot.val().context,
          //comment: snapshot.val().comment,
          imageEffect: snapshot.val().imageEffect,
          like: like
        })
      }
      if(snapshot.val().comment){
        postRef.set({
          userid:snapshot.val().userid ,
          imagePath: snapshot.val().imagePath,
          createdAt: snapshot.val().createdAt,
          context: snapshot.val().context,
          imageEffect: snapshot.val().imageEffect,
          like: like,
          comment: snapshot.val().comment,
        })
      }
    });
  }


var randomEffect = function() {
 var effectArray = ["blend-blue", "blend-blue-dark","blend-blue-light","blend-orange","blend-orange-dark","blend-orange-light","blend-red","blend-red-dark","blend-red-light","blend-green","blend-green-dark","blend-green-light","blend-yellow","blend-yellow-dark","blend-yellow-light","blend-purple","blend-purple-dark","blend-purple-light","blend-pink","blend-pink-dark","blend-pink-light","blend-blue-yellow","blend-blue-yellow-dark","blend-blue-yellow-light","blend-pink-yellow","blend-pink-yellow-dark","blend-pink-yellow-light","blend-red-blue","blend-red-blue-dark","blend-red-blue-light"];
 var randomNum = parseInt((Math.random() * (effectArray.length- 0)), 10);
 return effectArray[randomNum];
}


function createFollow(index, snapshot, $scope, $stateParams, follow) {
  var followUserRef = usersRef.child(snapshot.val()[$stateParams.type][index]);
  followUserRef.on('value', function(childsnapshot) {
    follow[snapshot.val()[$stateParams.type][index]] = childsnapshot.val();
    $scope.follow = follow;
    //$scope.$apply();
  });
}

function createComment(key, commentTemp) {
  var userRef = usersRef.child(commentTemp[key].userId);
  userRef.once('value', function(userSnapshot) {
    commentTemp[key].username = userSnapshot.val().username;
    commentTemp[key].photo = userSnapshot.val().photo;
  });
}


