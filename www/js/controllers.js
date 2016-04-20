
var ref = new Firebase("https://blistering-heat-1061.firebaseio.com");
var postsRef = ref.child("posts");
var usersRef = ref.child("users");

angular.module('app.controllers', [])

.controller('homeCtrl', function($scope, $state) {
  postsRef.on("value", function(snapshot) {
    $scope.posts = snapshot.val();
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

.controller('shootCtrl', function($scope) {

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

  $scope.changePassword = function() {
  }
})




