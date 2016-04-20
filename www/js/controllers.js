// var Firebase = require("firebase");
var ref = new Firebase("https://glaring-fire-2965.firebaseio.com");
var postsRef = ref.child('posts');
var usersRef = ref.child("users");

function getCurrentDate() {
    var date  = new Date();
    var month = date.getUTCMonth() + 1; //months from 1-12
    var day = date.getUTCDate();
    var year = date.getUTCFullYear();

    var hour = date.getHours(); // => 9
    var minute = date.getMinutes(); // =>  30

    var newDate = year + "/" + month + "/" + day + "   ";
    var newTime = hour + ":" + minute ;
    return newDate + newTime;

  }

angular.module('app.controllers', [])

.controller('homeCtrl', function($scope, $state) {
  postsRef.on("value", function(snapshot) {
     // $scope.$apply(function() {
    $scope.posts = snapshot.val();
    //});
  }, function (errorObject) {
    console.log("The read failed: " + errorObject.code);
  });

  $scope.detail = function(userid) {
    $state.go('user', {
      userid: userid
    });
  }
})


.controller('userCtrl', function($scope, $stateParams) {
  console.log($stateParams.userid);
  $scope.userdata = {};
  $scope.userdata.posts = [];

  postsRef.on("value", function(snapshot) {
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
    console.log('name: ' + $scope.userdata.username);
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
        console.log(snapshot.val().username);
      }, function (errorObject) {
        console.log("The read failed: " + errorObject.code);
      });

      postsRef.on("value", function(snapshot) {
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

.controller('signupCtrl', function($scope, $state) {
  $scope.signupForm = {};
  $scope.submit = function() {
    ref.createUser({
      email    : $scope.signupForm.email,
      password : $scope.signupForm.password
    }, function(error, userData) {
      if (error) {
        console.log("Error creating user:", error);
      } else {
        console.log("Successfully created user account with uid:", userData.uid);
        var username = $scope.signupForm.username;
        var email = $scope.signupForm.email;
        usersRef.child(userData.uid).set({
          username: username,
          posts: [],
          email: email
        });
        $state.go('login');
      }
    });
  }
})


.controller('loginCtrl', function($scope, $state) {
  $scope.signinForm = {};
  $scope.submit = function() {
    console.log($scope.signinForm.email);
    console.log($scope.signinForm.password);
    ref.authWithPassword({
      email    : $scope.signinForm.email,
      password : $scope.signinForm.password
    }, function(error, authData) {
      if (error) {
        console.log("Login Failed!", error);
      } else {
        console.log("Authenticated successfully with payload:", authData);
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

      ref.onAuth(function(authData) {
        var username;
        var userRef = usersRef.child(authData.uid);
        userRef.on('value', function(snapshot) {
            username = snapshot.val().username;
        });

        postsRef.push().set({
          userid:authData.uid ,
          username: username,
          imagePath: imageURI,
          createdAt:getCurrentDate(),
          context: $scope.comment,
          like: ['userid1', 'userid2']

        });

        $state.go('tabsController.home');
    }, function(err) {
        console.log(err);
    });

  }



  $scope.cancle = function() {
    console.log("cancel");
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

})

