angular.module('app.controllers', ['ionic','ngCordova'])

.controller('homeCtrl', function($scope) {

  var postsRef = new Firebase("https://sweltering-heat-3844.firebaseio.com/posts");

  postsRef.on("value", function(snapshot) {
    $scope.posts = snapshot.val();
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

.controller('accountSettingCtrl', function($scope) {

})

.controller("cameraController", function ($scope, $http, $cordovaCamera, $firebaseArray) {
  var postsRef = new Firebase("https://sweltering-heat-3844.firebaseio.com/posts");
  $scope.upload = function(imageData) {
    var FR = new FileReader();
    var syncArray = $firebaseArray(postsRef);
    syncArray.$add({
        imageString: imageData,
    })
    .then(function() {
        console.log('Image has been uploaded');
    });
  }

  // $cordovaFileTransfer
  // $scope.upload = function(imagePath) {

  //   var POLICY_JSON = { "expiration": "2016-05-30T12:00:00.000Z",
  //                       "conditions": [
  //                         {"bucket": "instphoto"},
  //                         {"acl": "public-read"},
  //                       ]
  //                     };

  //   var policyEncBase64 = btoa(JSON.stringify(POLICY_JSON));
  //   var secret = "D/hlTPki0KtR1jetfAtZnGFZclbHO7OWcUfFfhXx";
  //   var signature = btoa( Crypto.HMAC(Crypto.SHA1, policyEncBase64, secret, { asString: true }) )
  //   // var encodedSignature = b64_hmac_sha1(secret, policyEncBase64);
  //   var s3URI = encodeURI("https://instphoto.s3.amazonaws.com/"),
  //       policyBase64 = policyEncBase64,
  //       // signature = encodedSignature,
  //       awsKey = 'AKIAII5PKO2YXV4IMO7A',
  //       acl = "public-read";

  //   var options = {};
  //   options.fileKey = "file";
  //   options.fileName = new Date().getTime() + ".jpg";
  //   options.mimeType = "image/jpeg";
  //   options.chunkedMode = false;
  //   options.params = {
  //                       "key": options.fileName,
  //                       "AWSAccessKeyId": awsKey,
  //                       "acl": acl,
  //                       "policy": policyBase64,
  //                       "signature": signature,
  //                       "Content-Type": "image/jpeg"
  //                   };


  //   $cordovaFileTransfer.upload(s3URI, imagePath, options).then(function (result) {
  //           console.log("SUCCESS: " + JSON.stringify(result.response));
  //       }, function (err) {
  //           console.log("ERROR: " + JSON.stringify(err));
  //       }, function (progress) {
  //           // PROGRESS HANDLING GOES HERE
  //       });
  // };

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
});
