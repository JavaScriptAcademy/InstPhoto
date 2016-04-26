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


angular.module('app.controllers', [])
.controller('homeCtrl', function($scope, $state, $window) {
  //$scope.posts = [];
  postsRef.on("value", function(snapshot) {
      $scope.moment = moment;
      var posts = snapshot.val();
      var newPosts = {};

      reverseForIn(posts, function(key){
       newPosts[key] = this[key];
      });

      for(let key in newPosts){
        var userRef = usersRef.child(newPosts[key].userid);
        userRef.on('value', function(snapshot) {
          newPosts[key].username = snapshot.val().username;
          newPosts[key].photo = snapshot.val().photo;
          $scope.posts = newPosts;
          for(var post in $scope.posts){
            for(var i = 0; i < $scope.posts[post].like.length; i++){
              if($scope.posts[post].like[i] == currentlyId){
                $scope.posts[post].islike = true;
              }
            }
          }
        }, function(errorObject) {
          console.log("The read failed: " + errorObject.code);
        });
      }
      $scope.$apply();
  }, function (errorObject) {
    console.log("The read failed: " + errorObject.code);
  });

  $scope.detail = function(userid) {
    $state.go('user', {
      userid: userid
    });
  }

  $scope.showLike = showLike;
  $scope.like = likePhoto;
})

.controller('userCtrl', function($scope, $stateParams) {
  $scope.userdata = {};
  if($stateParams.userid === currentlyId) {
    $scope.isCurUserItself = true;
  }
  var userRef = usersRef.child($stateParams.userid);
  userRef.on("value", function(snapshot) {
    console.log('in userRef.on');
    console.log(snapshot.val());

    $scope.userdata.username = snapshot.val().username;
    $scope.userdata.photo = snapshot.val().photo;
    ref.onAuth(function(authData) {
      for(let index = 0; index < snapshot.val().follower.length-1; index++){
        if(snapshot.val().follower[index] === currentlyId){
          console.log('find it');
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
      console.log('in userRef');
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
      console.log(snapshot.val());
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
})


.controller('currentlyUserCtrl', function($scope, $state) {
  $scope.userdata = {};

  $scope.goSetting = function() {
    $state.go('setting');
  };

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
      like: [''],
      comments: {
        'commentid1': {
          userid: '8e96bd33-9fed-4128-a43b-5ea4cf07ed64',
          content: 'first com'
        },
        'commentid2': {
          userid: 'b328a4e7-4b77-4959-b834-6fb6c3620102',
          content: 'second com'
        }
      }
    });
    $state.go('tabsController.home');
  }
})


.controller('accountSettingCtrl', function($scope, $state) {
  $scope.edit = function() {
    console.log('in edit');
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
        userRef.on('value', function(snapshot) {
          username = snapshot.val().username;
          email = snapshot.val().email;
        }, function (errorObject) {
        console.log("The read failed: " + errorObject.code);
        });
        userRef.set({
          email: email,
          photo: imageURI,
          username: username
        });
        $state.go('tabsController.currentlyUser');
      }, function(err) {
          console.log(err);
      });
    }

    $scope.cancle = function() {
      console.log("cancel");
    }
})

.controller('commentsCtrl', function($scope, $stateParams, $state) {
  // let postid = $stateParams.postid;
  let postid = '-KGGQTfhdw30SQdZqmDk';
  let postRef = postsRef.child(postid);
  postRef.on('value', function(postSnapshot) {
    let comments = {};
    reverseForIn(postSnapshot.val().comments, function(key){
     comments[key] = this[key];
    });

    for(let key in comments){
      //if(key === 'commentid')continue;
      let userRef = usersRef.child(postSnapshot.val().userid);
      userRef.on('value', function(userSnapshot) {
        comments[key].username = userSnapshot.val().username;
        comments[key].photo = userSnapshot.val().photo;
        $scope.comments = comments;
        console.log($scope.comments);
      });
    }


  }, function (errorObject) {
    console.log("The read failed: " + errorObject.code);
  });


  $scope.detail = function(userid) {
    $state.go('user', {
      userid: userid
    });
  }

})

var showLike = function(post) {
  return post.like.length !== 1;
}

var likePhoto = function(key){
    console.log(key);
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
          like: like
        })
      }else{
        like.unshift(currentlyId);
        postRef.set({
          userid:snapshot.val().userid ,
          //username: snapshot.val().username,
          imagePath: snapshot.val().imagePath,
          createdAt: snapshot.val().createdAt,
          context: snapshot.val().context,
          like: like
        })
      }
    });
  }


