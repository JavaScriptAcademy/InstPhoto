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
      console.log($scope.posts);
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
    $state.go('follow', {
      from: 'curUser',
      type: 'follower',
      userid: currentlyId
    });
  }

  $scope.followedDetail = function() {
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
    $scope.imgURI = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCACAAIADASIAAhEBAxEB/8QAHAAAAgIDAQEAAAAAAAAAAAAAAwQFBgACBwEI/8QAOxAAAgEDAwIEAwYEAwkAAAAAAQIDAAQRBRIhBjETQVFhIjJxFFKBkaGxFSNCYgcWwSQzQ1Oj0dLh8P/EABoBAAIDAQEAAAAAAAAAAAAAAAIDAAEEBQb/xAAjEQACAgICAgIDAQAAAAAAAAAAAQIRAyESMRNBBCIyUWFx/9oADAMBAAIRAxEAPwA4WsYjFbtbz79vhmjrptw2PgNYtLtm/wAsf2JrGG5r0DBxTUljcQjlPyrI7G4PxBO9Fa/ZXkh3YArmtDCDUn/Dp9udtQeq6ta6SSk7Zl/5a9/x9KGDbf1L8kH7DGEVgjx5VXU60t2kw0HHqH5pz/M9i0RZVlLY4XHf8aa45AVPGTAXitgKpkusXk8hkEzoM8KpwBUjpnULeIsV6wKk4EuOR9aksMqskc0W6LMgwc08nI4pNeRnvTET7TzQ45U9hzjY0VJSgYPnTkTqRzRfCiemShy6YuMuOmR20ngVpLGVHNS3hRoMjFI3Tg5ApbgorYxTbZYBbRk5IoN3PFaIDjingOBzSeoWf2hAucZrEt9nn8dOVSejaIJcRhsd63dUhjJC1lvELaEKTnFEdBNE1Stkk/tS6IG/1+Gx0m8vGXPgISAfNuwH51we7mudRupJpHZmdizMfMmusdd2yWujxwBj/tE+SPZRmufRWUkreHBC0jdsIucV0PjQSjyXs244xW4kPBahW2lsn1pyEtFhQcqan4OkLyZQ00iQAnseT+Qqbs9Bs7CB0A8W4cFBIw7ZGOB5csK0hlVWOUW5kaN1XjDEcf8A3BoDEnjFXqGRbgsJVVkk/pfGCG2Nj/qmvYdB0S6wRalCQDhZDjkA+voahBLpnUmlj+xTnLKMxk+Y9KsqilrXpXTQ4kg8WCZTkNvJAP0PlUlFbM65PB7Ee9ZsmN3aNeHKqpmi5HaihmHnRks+cZplNO3DzoFjmMeSIgXYjk1kUPiNk9hR7m1aA+1bWkqg7DVJfamW39biOWt1JLcbHRlI8qeuhcLFlIWOKn/4fBHdeKIxuPtTYhR88D6Va+KjmyxQcuSRz1rm7uJQiwPgHnippIp1t+ImzirMljCjbtgzWhu7CMkSXVsmO++VR/rVv40WtEnjjKqVHNdY0sarexfb0YRW6F1jzjeSfP24qLuJrTSoyGMUEXoOP086d/xG6pitNVSLS3gmka3AMquGVOT6dz9a5dNNNdSmS5uN7seWdxWmEVGNIKv0Wi66rhjY/ZYjIBxuc4H5VAzdQag7Bkk2bSCNoHcbf/BT+FKKiEhVcMT93n9qkbTQL27P8q2cj1bgfrVucV2w445PpEVLd3NyAsjswGMA9hgY7fTiiQyyJ2LD6HFW606DvplzI0MQ9yWP6VKR/wCHvbddvj+2MD980t54Iavj5H6Kna6xewOGiu5oyB235B/A1a9D6mjZZRqU8cRA3iRhtDev400nQOng4lubtv7fE2j9BVE6p6ej0/X2s7PxTu27FLbjyfepHNGTpElglBWy53XXWmxPttRJdMPuDA/M1aenNTn1XTxdTWht1Y/ywWyWX19qo2g9ImII98u3n4og2S3sceXtXRLMqqBVAAAwAOwo01YDTrZrqQyh4qLt498w9qlr/wCQ1FwyeGTSMn57H4/wOkbkODkVisiscGqD/Hr0PvBGPSgy9S35fClVo1kTEvDJHQ5ZIniZXwVYFSPUGvmvrro8dParNNGLiTS5CWikUbtn9jHyx6+ddRGtXrKfjBpRNTuUdwzBg/DKwyD+FR5EEsLPn55VeTZbxcffY5q6dHaE93BJdtFvwdq7hnnzroupdG6X1BpUjkwafLBcEJMkaqMYHBA7gk1J9GaN/Dum4oJkUTCWTf8AUMR/pSpZFOOh0cTxz+xTpdAmgAmbYnPCnij219q9qFKi0aPz284+vpVx1XQ1vpQ0zs0Y/wCGOAfY+1QFl0gLGCaC3DBJH3mRiMj6Hy+lJtezTTfRN6PqRvVGVUN2IU8Uj1DrN7ZOi293FboTjLLk1MaHoCWMZAJJ71H650tDquRIocZ5ViRkUKtMOlLRppMlzd7Wk1COdm/qRePpwarnWFsU6w0ebaN0qqr/AFV+Kt2k9MWunmNreJoSi4G1ieD6+tOXWk29xqkV7NGGe3gcIW5Ckkc4/OjhKpWJyRtURiKW5p+3UrioyOfBppbo7eK1KUezK4y6Gr1gYz9KiCNxwKPLOX4rIFU96VN85aGRXGJHTybRigxI0nxUSZdz4o8SBVFVdRD7YEEo2K0PL5osvz0LODURCZsYF1O1+xluY5BIw++o8qsFuGjafcmEaVnUegPJ/XNUqC5ns7pLiBsMvqMgj0NWPTddfUrtoJIkjPh7l2efrQca6ClJtJP0TG6Aj48Y8jSs1zunSGGPKn52x2Ht70rLGftAXOF+vnUE0+o2t2/j2txcW8pI8aOQKkfsw7/jQJ26DSSRYYuotLhvGtDJIsvpIhWiC+trm4dIVdmA4OPhqMXTDNIZcaaNvBBmJPp3oF/arpsbPDbwPJk7VtJW3sfbyq6bLXFddlntruN4TxgjgqfKorWbgx2khRuJSIx9O5qO0yLUftjtdK0QkjG+JmDFT7kcZxXmsXDSXIgXHhx4IA9SOakU26AnS2IximEPOKAnejKRTkkhTZ5IOaHvZO1HZdwzSz0uSphJ2gEg/mUwvKil5f8AeUwnyirl0iAZR8dCKEsKLN89FRQVq7pEqzQRgrzTOhLt1qNc/OrL+laGvdK41y1I+/j9DVRZbLDJh2ZW4cHzpm24G0Yz5ULU7bxPjU4cdiKpGtXOuWc6y2rFlXui8H8KCthO+Oi7XdtcKDLAgYj+kEDNHt4ZGRJZQN+OPPFc6i6/nUhLsTBvNWUg1snUus6iyx2FvOzMcAlCqgH1J7Cjp+yvI6LzeX0VuZXLAkcADzqsPI0sryOfiY5NafZZLPEM85mmAy7nzY+ntWA4qQoGVhR3oyigA0VWpi7AYdSMYNLzLjtW+6hSPkVJtVRIp2LzHDg0ZHXaOaFLHvoYiYcUvTQyjeZgX4NHj+QUk7xRybZJY1b0ZgDUdf8AUcVuhjtfjf75HA+lEoOWkC5xjtk5cTxW0JllcKg8zWdF3I1XVrydgqx2pVY082LD5ifaueXepzXL7pZGf6ntRtB6sbpfXFnlQyWc42TBe6nyI9ab4eMf6K81y/h3G7TcO+Kj3iQ8Oufc0a11O11SyS7s50nhcZVlP6exoMh5rJLs1Q6FWsbTeHa3QkeZFMAx4VYx8OfOvDIhOCcGsLIp+HyFUEV/UJN2oTEfexQA1UPqG613pbqy7eQeLb3Lm4VRypRjx+XarNo2tW2s2omgOGHzoe6mnSg4qxCmpOvZMhua3DUANW4NVz1oviF3Vox4rzNeMeKCywm6q3qPVsUbvBYQyXEg4MijCqfrTOvX6QWhtwx8SUYIH3apU9wx+AYCjjArVhwprlIRlytPijLjVsynx0KZPzZyD+NFKtJb+MrKQQeM57VHPhhgjg+Rpa23W9+Igf5cqkAHyI5rV/DK2+x/xMjPl5+1CugJEKEAgr+1CScMXAOZEO1h97FbBwwBB49Kouya0+71joi8glVlktrmNZQFbdFMhGe/kw/MGuq6Lrdpr9mLi1bn+uMn4kPoa5p0y41C3Oj3UL3Vs+SERSzR/wBy47EfrXl9pmt9B6vHdReKsTH+VOUISUd9rD19vypOTCp/6Nx5nHR1mWH4sFc0eG2JAAHFJ9J9Uad1Rb7VxDfIMyWzHn6qfMft51ZxbKoz+1Y/G09mvyprRUeqekP8zadaG3mEF/akmGQjIIPdW9jXHbi1u+n79NUtVaO3lkaGZV5WKZfmX6HuP/VfRN5dJpmm3lyeFhRn/TP71wzfcXHQGssSrCa9WQhhzuAJJHp3rXiWmmZMr2miW0zqKG6ULcYjcjhv6T/2qcD5AIPBrlNjOWgXnHGRU7pmtXFrtQsXi+6fL6UM8Ce4hwzvqRe91as1BWUFAw8xmvC+azqA9yP/2Q==';
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
    $scope.imgURI = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAAAAAAAD/7gAOQWRvYmUAZAAAAAAB/+EAFkV4aWYAAE1NACoAAAAIAAAAAAAA/+wAEUR1Y2t5AAEABAAAADwAAP/hA5JodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+DQo8eDp4bXBtZXRhIHhtbG5zOng9ImFkb2JlOm5zOm1ldGEvIiB4OnhtcHRrPSJBZG9iZSBYTVAgQ29yZSA1LjYtYzAxNCA3OS4xNTY3OTcsIDIwMTQvMDgvMjAtMDk6NTM6MDIgICAgICAgICI+DQoJPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4NCgkJPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDpiMGZlOGZiZi0wMTA2LTRkYjEtYmFiNS0yMzA4YTA5ZTNkMmUiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6MDg2RkY1NTEwNjE0MTFFNUJFQzY4NkY1QUE2RDhCRjgiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6MDg2RkY1NTAwNjE0MTFFNUJFQzY4NkY1QUE2RDhCRjgiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTQgKE1hY2ludG9zaCkiPg0KCQkJPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6YjBmZThmYmYtMDEwNi00ZGIxLWJhYjUtMjMwOGEwOWUzZDJlIiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOmIwZmU4ZmJmLTAxMDYt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';
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
       //  $scope.imgURI = 'http://images.all-free-download.com/images/graphiclarge/daisy_pollen_flower_220533.jpg';
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
     // $scope.imgURI = 'http://www.dslrcameralife.com/wp-content/uploads/2015/06/039802938owki39323.png';
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
      console.log('submit');
      ref.onAuth(function(authData) {
        var userRef = usersRef.child(authData.uid);
        var username;
        var email;
        var follower;
        var followed;
        userRef.on('value', function(snapshot) {
          username = snapshot.val().username;
          email = snapshot.val().email;
          followed = snapshot.val().followed;
          follower = snapshot.val().follower;
        }, function (errorObject) {
        console.log("The read failed: " + errorObject.code);
        });
        userRef.set({
          email: email,
          photo: imageURI,
          username: username,
          follower: follower,
          followed: followed
        });
        $state.go('tabsController.currentlyUser');
      }, function(err) {
          console.log(err);
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
    $scope.$apply();
  });
}

function createComment(key, commentTemp) {
  var userRef = usersRef.child(commentTemp[key].userId);
  userRef.once('value', function(userSnapshot) {
    commentTemp[key].username = userSnapshot.val().username;
    commentTemp[key].photo = userSnapshot.val().photo;
  });
}


