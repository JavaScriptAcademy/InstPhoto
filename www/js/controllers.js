

var ref = new Firebase("https://sweltering-heat-3844.firebaseio.com");


var postsRef = ref.child('posts');
var usersRef = ref.child("users");
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

      var currentlyId;
      ref.onAuth(function(authData) {
        currentlyId = authData.uid;
      });

      for(let key in newPosts){
        var userRef = usersRef.child(newPosts[key].userid);
        userRef.on('value', function(snapshot) {
          newPosts[key].username = snapshot.val().username;
          newPosts[key].photo = snapshot.val().photo;
          // console.log($scope.posts);
          $scope.posts = newPosts;
          for(var post in $scope.posts){
            // console.log($scope.posts[post]);
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

  $scope.like = function(key){
    console.log(key);
    var postRef = ref.child('posts/' + key);
    var currentlyId;
    ref.onAuth(function(authData) {
      currentlyId = authData.uid;
    });
    postRef.once('value', function(snapshot){
      var like = snapshot.val().like;
      var flag = false;
      for(var i = 0; i < like.length; i++){
        if(like[i] == currentlyId){
          flag = true;
          like.splice(i, 1);
        }
      }
      if(flag){
        postRef.set({
          userid:snapshot.val().userid ,
          imagePath: snapshot.val().imagePath,
          createdAt: snapshot.val().createdAt,
          context: snapshot.val().context,
          like: like
        })
      }else{
        like.unshift(currentlyId);
        postRef.set({
          userid:snapshot.val().userid ,
          imagePath: snapshot.val().imagePath,
          createdAt: snapshot.val().createdAt,
          context: snapshot.val().context,
          like: like
        })
      }
    });
  }
})

.controller('userCtrl', function($scope, $stateParams) {
  $scope.userdata = {};
  postsRef.on("value", function(snapshot) {
    $scope.userdata.posts = [];
    snapshot.forEach(function(childSnapshot) {
      if(childSnapshot.val().userid === $stateParams.userid){
        $scope.userdata.posts.push(childSnapshot.val());
      }
    });
    $scope.userdata.postsNum = $scope.userdata.posts.length;
  }, function (errorObject) {
    console.log("The read failed: " + errorObject.code);
  });
  var userRef = ref.child("users/" + $stateParams.userid);
  userRef.on("value", function(snapshot) {
    $scope.userdata.username = snapshot.val().username;
    $scope.userdata.photo = snapshot.val().photo;
  }, function (errorObject) {
    console.log("The read failed: " + errorObject.code);
  });
})
.controller('currentlyUserCtrl', function($scope, $state) {
  $scope.myData = {};
  $scope.myData.posts = [];
  $scope.goSetting = function() {
    $state.go('setting');
  };
  ref.onAuth(function(authData) {
    if(authData === null) {
      $scope.myData.posts = [];
    } else {
      var usersRef = ref.child("users/" + authData.uid);

      usersRef.on("value", function(snapshot) {
        $scope.myData.username = snapshot.val().username;
        $scope.myData.photo = snapshot.val().photo;

      }, function (errorObject) {
        console.log("The read failed: " + errorObject.code);
      });

      postsRef.on("value", function(snapshot) {
        $scope.myData.posts = [];
        snapshot.forEach(function(childSnapshot) {
          if(childSnapshot.val().userid === authData.uid){
            $scope.myData.posts.push(childSnapshot.val());
          }
        });
        $scope.myData.postsNum = $scope.myData.posts.length;
      }, function (errorObject) {
        console.log("The read failed: " + errorObject.code);
      });
    }
  });
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
        usersRef.child(userData.uid).set({
          username: username,
          email: email,
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
    $scope.takePhoto = function () {
         $scope.imgURI = 'http://images.all-free-download.com/images/graphiclarge/daisy_pollen_flower_220533.jpg';
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
    $scope.submit = function(imageURI) {
      var currentlyId;
      ref.onAuth(function(authData) {
        currentlyId = authData.uid;
      }, function(err) {
          console.log(err);
      });
      postsRef.push().set({
        userid:currentlyId ,
        imagePath: imageURI,
        createdAt:getCurrentDate(),
        context: $scope.comment,
        like: [' ']
      });
      $state.go('tabsController.home');
  }
  $scope.cancle = function() {
    $state.go('tabsController.home');
  }
    //var ref = new Firebase("https://blistering-heat-1061.firebaseio.com");
    // ref.createUser({
    //   email    : $scope.signupForm.email,
    //   password : $scope.signupForm.password
    // }, function(error, userData) {
    //   if (error) {
    //     console.log("Error creating user:", error);
    //   } else {
    //     console.log("Successfully created user account with uid:", userData.uid);
    //     // var usersRef = ref.child("users");
    //     var username = $scope.signupForm.username;
    //     var email = $scope.signupForm.email;
    //     usersRef.child(userData.uid).set({
    //       username: username,
    //       posts: [],
    //       email: email
    //     });
    //     $state.go('login');
    //   }
    // });
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
  $scope.takePhoto = function() {
    $scope.imgURI = 'http://t-1.tuzhan.com/58894d829037/c-1/l/2012/09/21/17/382b2222e1884281870df47e1ae3f32d.jpg';
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

  $scope.choosePhoto = function() {
    $scope.imgURI = 'http://ww2.sinaimg.cn/crop.0.0.1080.1080.1024/d773ebfajw8eum57eobkwj20u00u075w.jpg';
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
    console.log(imageURI);
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