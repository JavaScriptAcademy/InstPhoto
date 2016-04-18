angular.module('app.controllers', [])

.controller('homeCtrl', function($scope) {

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
