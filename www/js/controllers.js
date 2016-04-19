
var ref = new Firebase("https://blistering-heat-1061.firebaseio.com");

angular.module('app.controllers', [])

.controller('homeCtrl', function($scope) {

})

.controller('shootCtrl', function($scope) {

})

.controller('currentlyUserCtrl', function($scope, $state) {
  var postsRef = ref.child("posts");
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
  // $scope.myData = {};
  // $scope.myData.posts = [ {text : "one"}, {text : "two"}, {text : "three"} ];
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
        var usersRef = ref.child("users");
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
  };

  $scope.changePassword = function() {
    var postsRef = ref.child("posts");
    postsRef.child('postID1').set({
      userid: 'userid1',
      imagePath: 'http://edge.alluremedia.com.au/m/k/2014/07/warcraft.jpg',
      createdAt: 'date1',
      context: 'context1',
      like: ['userid1', 'userid2']
    });
  }
})
