'use strict';

var ref = new Firebase("https://blistering-heat-1061.firebaseio.com");

var postsRef = ref.child('posts');
var usersRef = ref.child("users");

var currentlyId;
ref.onAuth(function(authData) {
  if(authData){
    currentlyId = authData.uid;
  }
});

angular.module('app.controllers', [])
.controller('homeCtrl', function($scope, $state, $window) {
  //$scope.posts = [];
  $scope.noposts = true;
  postsRef.on("value", function(snapshot) {
    $scope.moment = moment;
    let posts = {};
    for(let key in snapshot.val()){
      let userRef = usersRef.child(currentlyId);
      userRef.on('value', function(userSnapshot) {
        let postUserid = snapshot.val()[key].userid;
        // if(currentlyId === postUserid) {
        //   posts[key] = snapshot.val()[key];
        //   $scope.noposts = false;

        // }
        for(let index = 0; index < userSnapshot.val().followed.length; index++){
          if(userSnapshot.val().followed[index] === postUserid ||
            currentlyId === postUserid) {
            posts[key] = snapshot.val()[key];
            $scope.noposts = false;
          }
        }
      });
    }
    var newPosts = {};
    reverseForIn(posts, function(key){
     newPosts[key] = this[key];
    });

    for(let key in newPosts){
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
            let comment = $scope.posts[post].comment;
            let lastComment = comment[Object.keys(comment)[Object.keys(comment).length - 1]];
            var userRef = usersRef.child(lastComment.userId)
            userRef.once("value", function(snapshot){
              $scope.posts[post].lastcommentUser = snapshot.val().username;
            })
            $scope.posts[post].lastcommentContent = lastComment.content;
            if(Object.keys(comment).length > 1){
              let sLastComment = comment[Object.keys(comment)[Object.keys(comment).length - 2]];
              var userRef = usersRef.child(sLastComment.userId)
              userRef.once("value", function(snapshot){
                $scope.posts[post].sLastcommentUser = snapshot.val().username;
              })
              $scope.posts[post].sLastcommentContent = sLastComment.content;
            }
          }
        }

      }, function(errorObject) {
        console.log("The read failed: " + errorObject.code);
      });
    }

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
    let keyWord = $event.target.value;
    if(keyWord != null && keyWord != ''){
      let match = new RegExp(keyWord, "i");
      let matchUsers = [];
      usersRef.once("value", function(snapshot){
        let users = snapshot.val();
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
      for(let index = 0; index < snapshot.val().follower.length-1; index++){
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
    for(let key in newPosts) {
      if(newPosts[key].userid === $stateParams.userid){
        $scope.userdata.posts[key] = newPosts[key];
      }
    }

    var postsNum = 0;
    for(let post in $scope.userdata.posts){
      postsNum++;
      for(let i = 0; i < $scope.userdata.posts[post].like.length; i++){
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
      for(let index = 0; index < followed.length-1; index++){
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
      for(let index = 0; index < follower.length-1; index++){
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

  $scope.getLength = function(obj) {
    return Object.keys(obj).length;
  }

  $scope.commentsPage = function(postid) {
    $state.go('comments', {
      postid: postid
    });
  }

  $scope.followedDetail = function() {
    $state.go('follow', {
      from: 'user',
      type: 'followed',
      userid: $stateParams.userid
    });
  }
})


.controller('currentlyUserCtrl', function($scope, $state) {
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
    let currentlyId = authData.uid;
    var userRef = usersRef.child(currentlyId);
    userRef.on("value", function(snapshot) {
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
      for(let key in newPosts) {
        if(newPosts[key].userid === currentlyId){
          $scope.userdata.posts[key] = newPosts[key];
        }
      }
      var postsNum = 0;
      for(let post in $scope.userdata.posts){
        postsNum++;
        for(let i = 0; i < $scope.userdata.posts[post].like.length; i++){
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
    console.log(postid);
    let postRef = postsRef.child(postid);
    postRef.set(null);
  }

  $scope.followerDetail = function() {
    $state.go('follow', {
      from: 'curUser',
      type: 'follower',
      userid: currentlyId
    });
  }

  $scope.followedDetail = function() {
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
          photo: 'http://t-1.tuzhan.com/42671170e37a/c-1/l/2012/09/21/15/2729ba416b0c495f9c847895388ab11c.jpg'
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
  let follow = {};
  let userRef = usersRef.child($stateParams.userid);
  userRef.on('value', function(snapshot) {
    for(let index = 0; index < snapshot.val()[$stateParams.type].length-1; index++) {
      let followUserRef = usersRef.child(snapshot.val()[$stateParams.type][index]);
      followUserRef.on('value', function(childsnapshot) {
        follow[snapshot.val()[$stateParams.type][index]] = childsnapshot.val();
        $scope.follow = follow;
        $scope.$apply();
      });
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
    $scope.imgURI = 'http://media02.hongkiat.com/ww-flower-wallpapers/roundflower.jpg';
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
    $scope.imgURI = 'http://img00.deviantart.net/ae17/i/2013/118/4/6/rainbow_flower_by_i_is_kitty-d5l8o1g.jpg';
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
    postsRef.push().set({
      userid: currentlyId,
      imagePath: imageURI,
      createdAt:getCurrentDate(),
      context: $scope.comment,
      like: ['']
    });
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
    $scope.takePhoto  = function () {
      $scope.imgURI = 'https://s-media-cache-ak0.pinimg.com/236x/27/d1/66/27d16665573efaae154badd5980ee612.jpg';
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
      $scope.imgURI = 'http://www.dslrcameralife.com/wp-content/uploads/2015/06/039802938owki39323.png';
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
      ref.onAuth(function(authData) {
        var userRef = usersRef.child(authData.uid);
        var username;
        var email;
        var follower;
        var followed;
        userRef.on('value', function(snapshot) {
          username = snapshot.val().username;
          email = snapshot.val().email;
          followed = snapshot.val().followed;
          follower = snapshot.val().follower;
        }, function (errorObject) {
        console.log("The read failed: " + errorObject.code);
        });
        userRef.set({
          email: email,
          photo: imageURI,
          username: username,
          follower: follower,
          followed: followed
        });
        $state.go('tabsController.currentlyUser');
      }, function(err) {
          console.log(err);
      });
      $state.go('tabsController.currentlyUser');
    }

    $scope.cancle = function() {
      console.log("cancel");
    }
})

.controller('commentsCtrl', function($scope, $stateParams, $state) {
  let postid = $stateParams.postid;
  let postRef = postsRef.child(postid);
  postRef.on('value', function(postSnapshot) {
    let commentTemp = postSnapshot.val().comment;
    for(let key in commentTemp){
      let userRef = usersRef.child(commentTemp[key].userId);
      userRef.once('value', function(userSnapshot) {
        commentTemp[key].username = userSnapshot.val().username;
        commentTemp[key].photo = userSnapshot.val().photo;
      });
    }

    let comments = {};
    reverseForIn(commentTemp, function(key){
      comments[key] = this[key];
    });

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
          like: like
        })
      }
      if(snapshot.val().comment){
        postRef.set({
          userid:snapshot.val().userid ,
          imagePath: snapshot.val().imagePath,
          createdAt: snapshot.val().createdAt,
          context: snapshot.val().context,
          like: like,
          comment: snapshot.val().comment,
        })
      }
    });
  }

