var ref = new Firebase("https://blistering-heat-1061.firebaseio.com");

var postsRef = ref.child('posts');
var usersRef = ref.child("users");

var currentlyId;
ref.onAuth(function(authData) {
  if(authData){
    currentlyId = authData.uid;
  }
});

function preCreateHomePost(key, snapshot, posts, $scope) {
  var userRef = usersRef.child(currentlyId);
  userRef.on('value', function(userSnapshot) {

    var postUserid = snapshot.val()[key].userid;
    for(var index = 0; index < userSnapshot.val().followed.length; index++){
      if(userSnapshot.val().followed[index] === postUserid ||
        currentlyId === postUserid) {
        posts[key] = snapshot.val()[key];
        $scope.noposts = false;
      }
    }
  });
}

function createHomePost(key, $scope, newPosts) {
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
        var comment = $scope.posts[post].comment;
        var lastComment = comment[Object.keys(comment)[Object.keys(comment).length - 1]];
        var userRef = usersRef.child(lastComment.userId)
        userRef.once("value", function(snapshot){
          $scope.posts[post].lastcommentUser = snapshot.val().username;
        })
        $scope.posts[post].lastcommentContent = lastComment.content;
        if(Object.keys(comment).length > 1){
          var sLastComment = comment[Object.keys(comment)[Object.keys(comment).length - 2]];
          var userRef = usersRef.child(sLastComment.userId)
          userRef.once("value", function(snapshot){
            $scope.posts[post].sLastcommentUser = snapshot.val().username;
          })
          $scope.posts[post].sLastcommentContent = sLastComment.content;
        }
      }
      //  console.log($scope.posts);
    }

  }, function(errorObject) {
    console.log("The read failed: " + errorObject.code);
  });
}

angular.module('app.controllers', [])
.controller('homeCtrl', function($scope, $state, $window) {
  //$scope.posts = [];
  $scope.noposts = true;




  postsRef.on("value", function(snapshot) {
    $scope.moment = moment;
    var posts = {};
    for(var key in snapshot.val()){
      preCreateHomePost(key, snapshot, posts, $scope);
    }





    var newPosts = {};
    reverseForIn(posts, function(key){
     newPosts[key] = this[key];
    });

    for(var key in newPosts){
      createHomePost(key, $scope, newPosts);
    }

    //$scope.$apply();
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
    var keyWord = $event.target.value;
    if(keyWord != null && keyWord != ''){
      var match = new RegExp(keyWord, "i");
      var matchUsers = [];
      usersRef.once("value", function(snapshot){
        var users = snapshot.val();
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
      $scope.isfollowed = false;
      for(var index = 0; index < snapshot.val().follower.length-1; index++){
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
    for(var key in newPosts) {
      if(newPosts[key].userid === $stateParams.userid){
        $scope.userdata.posts[key] = newPosts[key];
      }
    }

    var postsNum = 0;
    for(var post in $scope.userdata.posts){
      postsNum++;
      for(var i = 0; i < $scope.userdata.posts[post].like.length; i++){
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
      for(var index = 0; index < followed.length-1; index++){
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
      for(var index = 0; index < follower.length-1; index++){
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

  $scope.followedDetail = function() {
    $state.go('follow', {
      from: 'user',
      type: 'followed',
      userid: $stateParams.userid
    });
  }
    $scope.followerDetail = function() {
    console.log('test');
    $state.go('follow', {
      from: 'user',
      type: 'follower',
      userid: $stateParams.userid
    });
  }

  $scope.getLength = function(obj) {
    return Object.keys(obj).length;
  }

  $scope.commentsPage = function(postid) {
    $state.go('comments', {
      postid: postid
    });
  }
})

.controller('currentlyUserCtrl', function($scope, $state, $ionicActionSheet) {
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

    var currentlyId = authData.uid;
    var userRef = usersRef.child(currentlyId);

    userRef.on("value", function(snapshot) {
      console.log(snapshot.val());
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
      for(var key in newPosts) {
        if(newPosts[key].userid === currentlyId){
          $scope.userdata.posts[key] = newPosts[key];
        }
      }
      var postsNum = 0;
      for(var post in $scope.userdata.posts){
        postsNum++;
        for(var i = 0; i < $scope.userdata.posts[post].like.length; i++){
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
    var hideSheet = $ionicActionSheet.show({
     buttons: [
       { text: '<b>DELETE</b>' }
     ],
     titleText: 'Delete the post',
     cancelText: 'Cancel',
     cancel: function() {
          // add cancel code..
        },
     buttonClicked: function(index) {
      if(index === 0){
        console.log('delete !');
        console.log(postid);
        var postRef = postsRef.child(postid);
        postRef.set(null);
       return true;
      }
     }
   });


  }

  $scope.followerDetail = function() {
    console.log('test');
    $state.go('follow', {
      from: 'curUser',
      type: 'follower',
      userid: currentlyId
    });
  }

  $scope.followedDetail = function() {
    console.log('test1');

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
          photo: 'data:image/jpeg;base64,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'
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
  var follow = {};
  var userRef = usersRef.child($stateParams.userid);
  userRef.on('value', function(snapshot) {
    for(var index = 0; index < snapshot.val()[$stateParams.type].length-1; index++) {
      createFollow(index, snapshot, $scope, $stateParams, follow);
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
    $scope.imgURI = 'data:image/jpeg;base64,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';
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
    $scope.imgURI = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAAAAAAAD/7gAOQWRvYmUAZAAAAAAB/+EAFkV4aWYAAE1NACoAAAAIAAAAAAAA/+wAEUR1Y2t5AAEABAAAADwAAP/hA5JodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+DQo8eDp4bXBtZXRhIHhtbG5zOng9ImFkb2JlOm5zOm1ldGEvIiB4OnhtcHRrPSJBZG9iZSBYTVAgQ29yZSA1LjYtYzAxNCA3OS4xNTY3OTcsIDIwMTQvMDgvMjAtMDk6NTM6MDIgICAgICAgICI+DQoJPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4NCgkJPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDpiMGZlOGZiZi0wMTA2LTRkYjEtYmFiNS0yMzA4YTA5ZTNkMmUiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6MDg2RkY1NTEwNjE0MTFFNUJFQzY4NkY1QUE2RDhCRjgiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6MDg2RkY1NTAwNjE0MTFFNUJFQzY4NkY1QUE2RDhCRjgiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTQgKE1hY2ludG9zaCkiPg0KCQkJPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6YjBmZThmYmYtMDEwNi00ZGIxLWJhYjUtMjMwOGEwOWUzZDJlIiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOmIwZmU4ZmJmLTAxMDYtNGRiMS1iYWI1LTIzMDhhMDllM2QyZSIvPg0KCQk8L3JkZjpEZXNjcmlwdGlvbj4NCgk8L3JkZjpSREY+DQo8L3g6eG1wbWV0YT4NCjw/eHBhY2tldCBlbmQ9J3cnPz7/2wBDAAYEBAQFBAYFBQYJBgUGCQsIBgYICwwKCgsKCgwQDAwMDAwMEAwODxAPDgwTExQUExMcGxsbHB8fHx8fHx8fHx//2wBDAQcHBw0MDRgQEBgaFREVGh8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx//wAARCAEsASwDAREAAhEBAxEB/8QAHAABAAIDAQEBAAAAAAAAAAAAAAcIBAUGAwEC/8QAURAAAQMCAgQICgUICAQHAAAAAAECAwQFEQYxEgcIIUFRYRNzszdxsSIyshR0NXU2gZGhQiPRUmIzk8M0tPBygpLCgxUXwaLTVCRElEVVVif/xAAbAQEBAAMBAQEAAAAAAAAAAAAAAQQFBgMCB//EADYRAQACAQIEAgcGBQUAAAAAAAABAgMRBCExEgVBMvBRYXGxweGBYnITMwah0fFCNCKCwkMU/9oADAMBAAIRAxEAPwCMSgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA3WWMm5mzPVLT2Sgkq3Mw6WRMGxR4/nyOVGN8GOIEgRbs+f3xo51XbInLpjfNOrk8OrC5PtATbs+f441e2rtkrk0RsmmRy+DXhan2gR/mbJuZssVSU97oJKRz8eikXB0T8PzJGqrHfQoGlA7+zbDs/Xi1Ut0ooKd1JWRtmgc6djVVruFMU4gNTnDZtmrKSUa3iGNq17nspmwyJKrnM1cUwb/AF0A3mX9ge0S80zal1NDbInpjH6+90b1Tq2Nkkb/AGmoBsqvdr2gwQOkint1U9uiGKaRHu8CyxRs+twEaXaz3Sz18tvudLJSVkK4SQSt1XJjoXnReJU4FAwwN1ljJmZsz1K09koJKtzMOllTBsTMfz5HKjG+DHECQId2fP740c6rtkTl0xvmmVyeHVhcn2gfJ92jP8cavZVW2ZyaI2TTI5fBrwsb9oEfZlyhmTLNWlLe6CSjkfj0b3YOjeiadSRqqx30KBpwJAtOwzaBdbXSXOjgp3UtbEyeBzp2IqskTWbinEuCgafOGzjNGUVom3iGNrrgr20zYZElVyx6usmDesTADfZf2B7RLxTNqXU8NsiemMfr73RvVOrY2R7f7TUAz67dt2hU1O6WKW31j2pikEE0iPd4OliiZ9bgIyuFurrbWzUNfA+mrKd2pNBK1WvavOigddlXY7nzMsDKqkoUpaKThZV1juhY5F42pg6Ryc7W4AdK/dmz81iuSttb1RMUa2afFeZMYET7QI8zPlHMOWK/1G90b6WZyK6Jy4OjkanBrRvbi1yeLjA04AAAAAAAAAAAAZ1ns1ZdaroKZMEamtLK7HVY3lXD7D1xYpvOkMXd7ymCnVb7I9bBPJlNhl6y1V8vlDaKXgnrpmQMcqYo3XXBXrhxNThUC6mW8uWrLlmp7Ra4kipaduGPBrPd96R6ppc5eFVIF4zPlyyqxt2udLQOkTFjKiZkbnJyo1yoqoB9s+Zsu3rXS0XOlr1jTGRtPMyRzU5XNaqqgHzMmXLVmKz1FpukKTUtQ3BdGsx33ZGKuOq5ulFApZmKyVVivtfZ6pcZ6GZ8DnomCORq4I9E5HJg5Ci3myru5y97FF4iDeVljtVbcqK5VdM2astySeoyv4eiWbV13NTRrLqJw6U4gMe4ZuypbZ/V7heaGknxwWKeoijei87XORQNlTVNNVQMqKaVk8EiYxzRuR7HJytc3FFAjPeAybS3jJst5jjRLnZkSVkqJ5TqdVwljcvIiLrpyYc6gVqy3Y6m/X6gs9MurNXTMhR6pijEcvlPVORrcXKUXTy7l21Zes9PabXCkNJTtwRODWe77z3qmGs52lVIPK9ZvytZJGxXe60tDK9NZsU0rWvVOXUx1sOfAD92XNOW75r/AOj3Omr3RpjIyCVr3NTlc1F1kT6APmZ8tWrMtlqLRdIkkpqhq4O4NeN+HkyRrxOauj8gFLL7Z6qy3qutNVh6xQzPgkVNDlY5U1kx4naUKLhbMu73Lvw+n7NCDb1litNZc6K6VVM2ettySJQyv4ei6bV13NTRrLqJ5WkDwuGbcq26o9Xr7xRUlRjh0M9RFG/Hna5yKBtIpY5Y2SxPbJFIiOY9qorXNVMUVFTSigaG8ZCyreL9RXy5UDKm4ULVZC5/CxUxxb0jdD9RcdXHRj4ANjdL/Y7S1HXS401C1yYtWpmZFj4NdUxA9rfc7bcqZKq3VUNZTOXBJ6eRsrFVNKazFVAOY2sZVpcx5HuVPJGjqukifV0MmHlNmhar0RF/TRFYvhApwUZtqtNVc5ZYabBZoonSoxfvaqomqnPwnpixTeZiGNut1XBEWtymdPcw3Ncxytcitc1cHNXgVFTiU85hkxMTGsPgAAAAAAAGysdhrbxVpDA3Vibh006p5LE/4ryIe2HDbJOkMPe76m3p1W5+EetKVutFFa7etNSM1W6qq968Lnuw85ym7x4q0rpDhdxu758nVefohs55+jJH3faVk+02he9MfV4aiVuPL0Ss/wAYFsCCjua7vW3fMlyuNbIslRUVEjnK5VXBEcqNamP3WtRGonIUeuS7vW2jNdqr6KR0c0VTFjqrhrMc9GvYuH3XNVUUC7pBU3b/AE8cW0+4uYmCzRU8jvD0LW/4SixGyru5y97FF4iDid43NV/stotVJaqx9HFcnTtrHxeTI5saR6rUenC1F11xw0gVpVVVVVVxVeFVUonzddula9L7a3yK6jiSCohiVeBj3q9r1b/WRrcfAQS9npjX5JzAxyYtW21eKf5DwK17v0Ecu06ge9MVhhqJGeHonM8Tii2BBRe/3Wsu16rrlWyLLU1cz5ZHOXHhV3AiczU4ETiQoz8h3attOcbPW0cixysq4WuwXDWje9GSMXmc1VRQLskFSdvNPHDtRuysTBJW08jk/SWnYi/XgUWQ2Zd3uXfh9P2aEHA7x2bMw2W32iitVY+jhuS1KVjovJkc2JI9VqPTymp+IuOGkCtrnK5Vc5cXLwqq6VUos/u2V1VU5AnhmkV8dHXyxU6KuOrGsccmqnNrvcv0kHS7XswXWwZAuVztU3QV0awsjm1UcrUllaxyojsUx1XcAFQa2ura+qkq62eSqqpV1pZ5nK97l5Vc5VVSiYt2Cuqm5lu9Cki+qy0STvix4OkjlY1rsOXCRwFhLt7qreol9BSCiRR1Ozr39J7O/wBJhm7D9T7Gj/cH+PH4o+EuhzZlCO4sdWUTUZcETFzdDZUTiXkdyL9Zl7raxfjXzfFp+1d2nDPRfjj+H0RvLFJFI6OVqskYuD2OTBUVOJUU1ExMcJdnW0WjWJ1iX5IoAAAANtl/LtXeanUj/Dp2frp1TFGpyJyu5j3wYJyTw5MDf9wptq6zxtPKEp2220lupGUtKzUiZ9bl43OXjVTd48cUjSHCbjcXzXm951mWtzPmams9NqIiS1kqfhQY6E0az8NCeM8dzuIxx7Wb23tttxbXlSOc/KEUGjd6k7d17yIvZKjxIBakgojcveNV10npKUelk980HtMXpoBeogqjvCd5lZ7PT9mhRYTZV3c5e9ii8RBGe9N/CZc6yr8UIFfiict1v3nmDqKf03gTXnf5Mv8A8Oq+weQVu3eE/wD0um9mqPQKLVkFDJ/18n9Z3jKM3LfzFa/bIO1aBeYgqbt/70Ll1VN2DCixmzLu9y78Pp+zQgiven83LXhrf3AEBFFmd2P5HuHxOTsISDd7fe666dZTfzEYFSyiYd2L5zufw53bxAWMu3uqs6iX0FIKJFG1y1eks9zbVOj6WNzVjlannI1yoqq3nTA99vm/Ltqwe47P/wBGLo10nnCWKSrpqymjqaaRJIZExY9P6aTe1tFo1jk4HLitjtNbRpaGizVlOG7RrUU+EdwYnA7QkiJoa7n5FMXc7WMnGPM2na+6zt56bccc/wAPd/JGc8E0Ez4ZmLHLGuq9jkwVFQ01qzE6S7al4vEWrOsS8yPoAAbfLeXp71WLG13R00WC1EvGiLjgjU5VwU99vgnJPsa/uPcK7amvO08oSpQ0NLQ0zKaljSOFmhqca8qrxqbylIrGkOEz575bTa86zLT5ozVT2iJYYlSS4PTyI9KMRfvP/IY+53MY40jzNj2ztdtxPVPDHH8fZCMKmpnqZ3zzvWSaRcXvdwqqmltaZnWXb48daVitY0iHmR9pO3de8iL2So8SAWpIKpVmwXadLWTyttkerJI9zf8AxMGhXKqffKP3bNg+02nuVJPJbY0jimje9fWYOBGvRV0PAtUQVR3hO82s9np+zQosJsq7ucvexReIgjPem/hMudZV+KECvxROW637zzB1FP6bwJrzv8mX/wCHVfYPIKTQVFRTydJTyvhkRMEfG5WuwXnQoym3m9uVGtrqlXLwIiSyYqq/SB1OW9je0K/6skNsdR0z/wDzVcvQMwXjRrk6Ryc7WqBLOUd221W6pp6693OSsqoHtlZBTIkMSPYqKmLnaz3JinFqkEzgVN2/96Fy6qm7BhRYzZl3e5d+H0/ZoQRXvT+blrw1v7gCAiizO7H8j3D4nJ2EJBu9vvdddOspv5iMCpZRMO7F853P4c7t4gLGXb3VWdRL6CkFEigBuMuZkqrNU4pjJSSL+PBjp/SbyOQyNvuJxz7Gv7h26m5r6rxyn08EpUFfSV9KyqpZEkhfoVNKLxoqcSobul4tGsOFz4L4rTW8aTDU5oyrT3eFZYkSKvYn4cuhHIn3X/l4jH3O2jJGseZn9s7nbb20njjnw9XthF00MsE0kMrdWWJyskavE5q4Kn1mlmJidJdzS8WrFo5S/BH0Adzsx/8Acv8AI/eGz7d/d9nzcv8AuX/r/wB3/F2Nx9e9Sm9Q1PW9X8HpPNx/poNhk6umenm53b/l9cfma9HjohyuSsSrm9c1/WtZem6TztbnxOevrrOvN+jYejojo06fDR4Hy9ACTt3XvIi9kqPEgFqSAAAAVR3hO82t6in7JCiwmyru5y97FF4iCM96b+Ey51lX4oQK/FE5brfvPMHUU/pvAmvO/wAmX/4dV9g8gpXbbfV3K4U1vo2dLV1crIYI04NZ8jka1MfCpRbfZ5sny5k+ihe2FlZetVFqLlI3WdrLpSHH9W1ObhXjIOvrrhQW+mfVV9TFSUzPPnne2NieFzlRAI7u237JdPcae22rpbvVTzRwJJEnRwNV7kbisj0xXDH7rVTnAkwCpu3/AL0Ll1VN2DCixmzLu9y78Pp+zQgiven83LXhrf3AEBFFmd2P5HuHxOTsISDd7fe666dZTfzEYFSyiYd2L5zufw53bxAWMu3uqs6iX0FIKJFAAB1OQUvX+oqtH/BcHrevjqYc36fIZ2y6+rh5fFou+zg/L/1+f+3Tn/RJRt3GIav3vy4+0zdopz+bz298v0bY/oU/BX4ME8mUAbnLOYpbLWOfq9JSzYJURppwbjg5q8qYqZG3zzjn2S13cu3xuaacrRySlQ11LXUzKmlkSSGRMWuTxKnEqG7peLRrDhc2G2K01tGkw1WZsrU15h6RuEVdGmEU3E79F/N4jw3G2jJH3mf23udtvOk8aTzj5wi+so6mjqH09TGsU0a4OY7x86c5pb0ms6S7jFmrkrFqzrEvE+Xok7d17yIvZKjxIBakgotX1lYldUok8mCSvTz3fnLzlHh69W/9xJ/fd+UB69W/9xJ/fd+UDykkkkdrSOV7vznKqr9oFy9lXdzl72KLxEEZ7038JlzrKvxQgV+KJy3W/eeYOop/TeBNed/ky/8Aw6r7B5BWTYLRx1O0+1rImslOyeZEX85sLkb9SuxKLakFM9pWb7tmXNdfPWTudSwTyRUNNivRxRMcrWo1ujWVExcvGpRpct/MVr9sg7VoF5iCpu3/AL0Ll1VN2DCixmzLu9y78Pp+zQgiven83LXhrf3AEBFFmd2P5HuHxOTsISDd7fe666dZTfzEYFSyiYd2L5zufw53bxAWMu3uqs6iX0FIKJFADd5ayvVXmfWdjFQsX8WfDT+izHSviMnb7ack/dazuPc67eunO88o+c+nFKNFRUtFSspqZiRwxpg1qeNeVVN1SkVjSHD5s1stptadZlqczZpprPCsbMJa96YxQ8Tf0n83jPDcbmMcfeZ/be2W3FtZ4Y45z8oRZPPLPPJPK7Wllcr5HaMXOXFV4Oc0lpmZ1l3VKRSsVjlHB+CPoAAbbL2YqyzVOtGqvpnr+PTqvA5OVOR3Oe+DPOOfYwN/2+m4rpPC0cp9PBKduuVHcaRlVSSdJE7g5FaqaWuTiVDd48kXjWHCbjb3w3ml40lg5jy7R3ilXpPw6mJF6GdE4U49V3K089xgjJHtZfbu4X29uHGs849PFEhoXfpO3de8iL2So8SAWpIKIXH3hVddJ6SlHnTIjqiJrkxRXtRUXjTEC5n+2Gzz/wCu0H7Bn5CCtu3C0Wu07QKmitlLFR0jIIHNghajGIrmIqrgnKUWP2Vd3OXvYovEQRnvTfwmXOsq/FCBX4onLdb955g6in9N4E153+TL/wDDqvsHkFbN3rvMpPZ6js1KLWkFFb375r/aJfTUo9Mt/MVr9sg7VoF5iCpu3/vQuXVU3YMKLGbMu73Lvw+n7NCCK96fzcteGt/cAQEUWZ3Y/ke4fE5OwhIN3t97rrp1lN/MRgVLKJh3YvnO5/DndvEBYy7e6qzqJfQUgokUbfK1liu91SmmerImMWWTV0uRqomqnJpMjbYYyW0lr+57ydvi6ojWddEr01NBTQMggYkcMaarGN0IhvK1iI0hwWTJa9ptadZlos1ZsgtMbqenVJLg5OBulI0X7zufkQxdzuopwjzNr2vtVs89VuGP4+7+aMqionqJnzzvWSWRcXvcuKqpprWmZ1l22PHWlYrWNIh5kfQAAAANlY79XWeq6anXWjdh00C+a9E8S8inthzWxzrDD3uxpuK6W5+E+pKNuu9FdbetTSvxbqqj2LwOY7DzXIbrHlreusOG3G0vgydN4+qHDn36Kkvd5mZHtLpWOXBZaaoYxOVUZr+JqgWsIKQ5xsVwseZrjba6J0c0U8itVyYI+NzlVkjeVrm8KFHnlWxXC+5gobXQROlqKiZieSiqjWayaz3YaGtThVQLxEFTNvtTHNtPuTWLj0EdPG5U/OSFrl9IosTsq7ucvexReIg4/eFyZmHMNotlVZqZaz/THTuqaePhmVsqMwdGz7+GouKJw8wFZZYpYZHRSsdHKxdV7HorXIqcSougon3dfstfFFervLE6OiqOhgppHJgkjo1e6RW8qNxRMfyEEt57kZHkjMD3rg1ttq8V/wAh4Fbt3pU/3Mo+enqMP2alFrSCj+b7XW2vNF0oa2J0VRFUy4tcipiivVWuTHS1zVxReNCja7O8l5mv9/oZrXQyS01NURSVFW5NSBjWPRy4yL5OOCaE4eYC5ZBU3b/3oXLqqbsGFFjNmXd7l34fT9mhBFe9P5uWvDW/uAICKLM7sfyPcPicnYQkG72+91106ym/mIwKllEw7sXznc/hzu3iAsZdvdVZ1EvoKQUSKOp2de/pPZ3+kwzdh+p9jR/uD/Hj8UfCXQ5szhHbmuo6FyPr14Hu0tiTn5XcifWZe63fRwr5vg0/au0TmnrycMfx+iN5ZZJZHSyuV8j1Vz3uXFVVdKqpqJmZnWXZ1rFY0jhEPyRQAAAAAAGbabxW2up6eldhimrJG7hY9vI5D0xZbUnWGNutpTPXpv8AWGEebJbTK9/qsvZhoL1TJrS0MzZdTHBHt0PYq8SPYqt+kC6GXMx2jMdogu1qnSeknTm1mO+9HI3h1Xt40IMi4Wa0XJGtuNDT1qM81KiJkqJ4NdFA+W+zWe2o5LdQ09Ej/PSniZFj4dREAw82Zrs+V7LPdrpKkcMTV6KLFOklkw8mONF0ud9mleACl19vFXerzW3arVPWK6Z88iJoRXux1Ux4m6EKLf7Ku7nL3sUXiIN1XX+0UFyobbWVLYKu59IlCx+KJI6LV1mo7zdby0wTj4gPSsstnrZEkrKCnqZE0PmiZI5PpcigZccbI2NjjajGNTBrWpgiInEiIBFO8HnektOVJMvwyo663dEa6Jq+VHTI7F73cmvq6iY6eHkAgPZzmWPLWdbVeJsUpoJdSqVEVcIZWrFIuCadVr1dhzFF0IJ4Z4Y54JGywytR8UrFRzXNcmLXNVOBUVNBBj1totNc9klbRQVT40wY6aJkitTmVyLgBjXq/wBiy7QxS18zKWF72QU0LU8p8j1RrWRRt4XLw8ScCcOgDaAVN2/96Fy6qm7BhRYzZl3e5d+H0/ZoQRXvT+blrw1v7gCAiizO7H8j3D4nJ2EJBu9vvdddOspv5iMCpZRMO7F853P4c7t4gLGXb3VWdRL6CkFEijMtd1q7ZLLNSqjZZY1i11TFWo5UVVbz+SemPLNJ1hj7na0zREX5ROrEc5znK5yq5zlxc5eFVVeNTzZERERpD4AAAAAAAAAAAAG1y/mnMWXapaqy18tDK7BH9GvkvRNCPY7Fjv7SAd9S7x+0WGNGyJQ1Lk+/LA5FX9m+NPsA+Ve8ftFnjVsXqVK5dEkUCq5P2r5E+wDgL/ma/wCYKtKu9V0tdOiKjHSuxaxF0oxqYNYnM1ANYBc3ZV3c5e9ii8RBGm9KqpS5cVFwVJKvBfohAjnL+2/aJZIG08dwStp2JgyKtYkyoicXSeTJ/wAxRs7hvFbRquB0UT6SiVyYdLTweWng6V0qfYBHFfcK64VktbXTyVNXO7Wmnlcr3uXnVQMcDrspbVs75WgSltlfrUKLi2iqGpLE3Hh8jW8pngaqAdLVbx+0WaJWRpQ0zlTDpYoHK5Of8R8jfsA4K55rzFdLtFdrjXy1dfC9skMsq6yMVio5NRnmNTFNCJgB1f8Av1tT/wDmG/8ApaX/AKQHIZhzFd8xXWW63edKiumRrZJUYyPFGNRrfJYjW6E5AOlte2jaPa7dTW6huiRUdJG2GnjWnp3arGJg1NZ0auXg5VA1ObM/ZqzYlKl+rEq0o9f1fCKKLV6XV1/1bWY46iaQOeA6jK20zOmVqCSgsdelLSyyrO+NYYZMZHNa1VxkY9dDEA98wbWc+5htM1pu1xSooJ1YssSQQR4qxyPb5TGNd5zU4wOQA3WVs4ZhytWy1tjqUpamaJYZHrHHJjGrkdhhI16aWoB0ku3XahLE+KS7tVkjVY9PVqZMUcmC6IwOBAAAAAAAAAAAAAAAAAAAAAAubsq7ucvexReIgjPem/hMudZV+KECvxQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACzWQNsezi05Ls1tr7v0NbSUrIqiL1eqdqvanCmsyJzV+hSDhtvmfspZrp7KywV3rjqR9QtQnRTRaqSJHq/rWMxx1V0FEPAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/9k=';
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
    console.log("submit");
    postsRef.push().set({
      userid: currentlyId,
      imagePath: imageURI,
      createdAt:getCurrentDate(),
      imageEffect: "",
      context: $scope.comment,
      like: ['']
    });
    $scope.imgURI=undefined;
    $scope.comment="";
    $state.go('tabsController.home');
  }

  $scope.cancle = function(imageURI) {
    console.log("cancle");
    $scope.imgURI=undefined;
    $scope.comment="";
    $state.go('tabsController.home');

  }

  $scope.surprise = function(imageURI) {
    console.log("surprise");
    console.log(randomEffect());
    postsRef.push().set({
      userid: currentlyId,
      imagePath: imageURI,
      createdAt:getCurrentDate(),
      context: $scope.comment,
      imageEffect:randomEffect(),
      like: ['']
    });
    $scope.imgURI=undefined;
    $scope.comment="";
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
    $scope.takePhoto = function () {
      $scope.imgURI = 'data:image/jpeg;base64,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';
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
      $scope.imgURI = 'data:image/jpeg;base64,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'
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
      console.log('submit');
      console.log('in auth');
      var userRef = usersRef.child(currentlyId);
      var username;
      var email;
      var follower;
      var followed;
      userRef.on('value', function(snapshot) {
        console.log(snapshot.val());
        username = snapshot.val().username;
        email = snapshot.val().email;
        console.log(email);
        followed = snapshot.val().followed;
        follower = snapshot.val().follower;
        userRef.set({
          email: email,
          photo: imageURI,
          username: username,
          follower: follower,
          followed: followed
        });
      }, function (errorObject) {
      console.log("The read failed: " + errorObject.code);
      });

      $state.go('tabsController.currentlyUser');
    }

    $scope.cancle = function() {
      $scope.imgURI=undefined;
      $state.go('tabsController.home');
    }

})

.controller('commentsCtrl', function($scope, $stateParams, $state) {
  var postid = $stateParams.postid;
  var postRef = postsRef.child(postid);
  postRef.on('value', function(postSnapshot) {
    var commentTemp = postSnapshot.val().comment;
    for(var key in commentTemp){
      createComment(key, commentTemp);
    }

    var comments = {};
    reverseForIn(commentTemp, function(key){
      comments[key] = this[key];
    });
    console.log(comments);
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
          imageEffect: snapshot.val().imageEffect,
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
          imageEffect: snapshot.val().imageEffect,
          like: like
        })
      }
      if(snapshot.val().comment){
        postRef.set({
          userid:snapshot.val().userid ,
          imagePath: snapshot.val().imagePath,
          createdAt: snapshot.val().createdAt,
          context: snapshot.val().context,
          imageEffect: snapshot.val().imageEffect,
          like: like,
          comment: snapshot.val().comment,
        })
      }
    });
  }


var randomEffect = function() {
 var effectArray = ["blend-blue", "blend-blue-dark","blend-blue-light","blend-orange","blend-orange-dark","blend-orange-light","blend-red","blend-red-dark","blend-red-light","blend-green","blend-green-dark","blend-green-light","blend-yellow","blend-yellow-dark","blend-yellow-light","blend-purple","blend-purple-dark","blend-purple-light","blend-pink","blend-pink-dark","blend-pink-light","blend-blue-yellow","blend-blue-yellow-dark","blend-blue-yellow-light","blend-pink-yellow","blend-pink-yellow-dark","blend-pink-yellow-light","blend-red-blue","blend-red-blue-dark","blend-red-blue-light"];
 var randomNum = parseInt((Math.random() * (effectArray.length- 0)), 10);
 return effectArray[randomNum];
}


function createFollow(index, snapshot, $scope, $stateParams, follow) {
  var followUserRef = usersRef.child(snapshot.val()[$stateParams.type][index]);
  followUserRef.on('value', function(childsnapshot) {
    follow[snapshot.val()[$stateParams.type][index]] = childsnapshot.val();
    $scope.follow = follow;
    //$scope.$apply();
  });
}

function createComment(key, commentTemp) {
  var userRef = usersRef.child(commentTemp[key].userId);
  userRef.once('value', function(userSnapshot) {
    commentTemp[key].username = userSnapshot.val().username;
    commentTemp[key].photo = userSnapshot.val().photo;
  });
}


