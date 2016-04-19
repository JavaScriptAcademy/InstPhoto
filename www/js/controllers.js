angular.module('app.controllers', ['ionic','ngCordova'])


.controller('homeCtrl', function($scope) {

  var postsRef = new Firebase("https://sweltering-heat-3844.firebaseio.com/posts");
  // postsRef.push({
  //   userId: 2,
  //   description: "Hello world",
  //   imagePath: "http://orig10.deviantart.net/49c3/f/2015/197/b/f/profile_picture_by_waht_da_fwack-d91lsh2.png",
  //   createdAt: new Date().getTime(),
  //   like: []
  // });
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
  $scope.goSetting = function() {
    $state.go('setting');
  }
})




.controller('signupCtrl', function($scope) {
  $scope.signupForm = {};
  $scope.submit = function() {
    console.log($scope.signupForm.email);
    console.log($scope.signupForm.password);
    var ref = new Firebase("https://blistering-heat-1061.firebaseio.com");
    ref.createUser({
      email    : $scope.signupForm.email,
      password : $scope.signupForm.password
    }, function(error, userData) {
      if (error) {
        console.log("Error creating user:", error);
      } else {
        console.log("Successfully created user account with uid:", userData.uid);
      }
    });
  }
})


.controller('loginCtrl', function($scope, $state) {
  $scope.signinForm = {};
  $scope.submit = function() {
    console.log($scope.signinForm.email);
    console.log($scope.signinForm.password);

    var ref = new Firebase("https://blistering-heat-1061.firebaseio.com");
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
            })

.controller('accountSettingCtrl', function($scope) {

})
