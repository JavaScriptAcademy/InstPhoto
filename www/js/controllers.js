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



.controller('homeCtrl', function($scope) {

  postsRef.push({
    userId: 2,
    description: "Hello world",
    imagePath: "http://orig10.deviantart.net/49c3/f/2015/197/b/f/profile_picture_by_waht_da_fwack-d91lsh2.png",
    createdAt: new Date().getTime(),
    like: []
  });

  postsRef.on("value", function(snapshot) {
    $scope.posts = snapshot.val();
    console.log("test: ",snapshot.val());
  }, function (errorObject) {
    console.log("The read failed: " + errorObject.code);
  });

})

.controller('shootCtrl', function($scope) {

})




.controller('currentlyUserCtrl', function($scope, $state) {
  // var postsRef = ref.child("posts");
  $scope.goSetting = function() {
    $state.go('setting');
  };
  postsRef.on("value", function(snapshot) {
    console.log(snapshot.val());
    $scope.myData = {};
    $scope.myData.posts = snapshot.val();

  }, function (errorObject) {
    console.log("The read failed: " + errorObject.code);
  });

  $scope.myData = {};
  $scope.myData.posts = [ {text : "one"}, {text : "two"}, {text : "three"} ];
})



.controller('signupCtrl', function($scope, $state) {
  $scope.signupForm = {};
  $scope.submit = function() {
    //var ref = new Firebase("https://blistering-heat-1061.firebaseio.com");
    ref.createUser({
      email    : $scope.signupForm.email,
      password : $scope.signupForm.password
    }, function(error, userData) {
      if (error) {
        console.log("Error creating user:", error);
      } else {
        console.log("Successfully created user account with uid:", userData.uid);
        // var usersRef = ref.child("users");
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

    //var ref = new Firebase("https://blistering-heat-1061.firebaseio.com");
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

.controller("cameraController", function ($scope, $cordovaCamera) {

    $scope.takePhoto = function () {
      var options = {
        quality: 75,
        destinationType: Camera.DestinationType.DATA_URL,
        sourceType: Camera.PictureSourceType.CAMERA,
        allowEdit: true,
        encodingType: Camera.EncodingType.JPEG,
        targetWidth: 300,
        targetHeight: 300,
        popoverOptions: CameraPopoverOptions,
        saveToPhotoAlbum: false
    };

        $cordovaCamera.getPicture(options).then(function (imageData) {
            $scope.imgURI = "data:image/jpeg;base64," + imageData;
        }, function (err) {
            // An error occured. Show a message to the user
        });
    }

    $scope.choosePhoto = function () {
      var options = {
        quality: 75,
        destinationType: Camera.DestinationType.DATA_URL,
        sourceType: Camera.PictureSourceType.PHOTOLIBRARY,
        allowEdit: true,
        encodingType: Camera.EncodingType.JPEG,
        targetWidth: 300,
        targetHeight: 300,
        popoverOptions: CameraPopoverOptions,
        saveToPhotoAlbum: false
    };

        $cordovaCamera.getPicture(options).then(function (imageData) {
            $scope.imgURI = "data:image/jpeg;base64," + imageData;
        }, function (err) {
            // An error occured. Show a message to the user
        });
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
          imagePath: 'http://edge.alluremedia.com.au/m/k/2014/07/warcraft.jpg',
          createdAt:getCurrentDate(),
          context: $scope.comment,
          like: ['userid1', 'userid2']

        });
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
  //var ref = new Firebase("https://blistering-heat-1061.firebaseio.com");
  $scope.edit = function() {
    console.log('in edit');
    ref.onAuth(function(authData) {
      if (authData) {
        console.log("Authenticated with uid:", authData.uid);
      } else {
        console.log("Client unauthenticated.")
      }
    });
    var date = new Date();
    console.log(date);

  }

  $scope.logout = function() {
    ref.unauth();
    $state.go('login');
  }

  // $scope.changePassword = function() {
  //   ref.onAuth(function(authoData) {
  //       postsRef.set({
  //         userid:authData.uid ,
  //         imagePath: 'http://edge.alluremedia.com.au/m/k/2014/07/warcraft.jpg',
  //         createdAt: 'date1',
  //         context: 'context1',
  //         like: ['userid1', 'userid2']
  //       });
  //   }, function(err) {
  //       console.log(err);
  //   });
  // }
})
