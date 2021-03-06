angular.module('app.routes', [])

.config(function($stateProvider, $urlRouterProvider) {

  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js
  $stateProvider

  .state('tabsController.home', {
    url: '/page2',
    cache: false,
    views: {
      'tab1': {
        templateUrl: 'templates/home.html',
        controller: 'homeCtrl'
      }
    }
  })

  .state('tabsController.shoot', {
    url: '/page3',
    views: {
      'tab2': {
        templateUrl: 'templates/shoot.html',
        controller: 'cameraController'
      }
    }
  })

  .state('tabsController.currentlyUser', {
    url: '/page4',
    views: {
      'tab3': {
        templateUrl: 'templates/currentlyUser.html',
        controller: 'currentlyUserCtrl'
      }
    }
  })

  .state('setting', {
    url: '/setting',
    templateUrl: 'templates/accountSetting.html',
    controller: 'accountSettingCtrl'
  })

  .state('tabsController', {
    url: '/page1',
    templateUrl: 'templates/tabsController.html',
    abstract:true
  })

  .state('signup', {
    url: '/signup',
    templateUrl: 'templates/signup.html',
    controller: 'signupCtrl'
  })

  .state('portrait', {
    url: '/portrait',
    templateUrl: 'templates/portrait.html',
    controller: 'portraitCtrl'
  })

  .state('login', {
    url: '/login',
    templateUrl: 'templates/login.html',
    controller: 'loginCtrl'
  })
  .state('user', {
    url: '/user',
    templateUrl: 'templates/user.html',
    controller: 'userCtrl',
    params: {
        userid: null
    }
  })

  .state('editPost', {
    url: '/editPost',
    templateUrl: 'templates/editPost.html',
    controller: 'editPostCtrl'
  })
  .state('follow', {
    url: '/follow',
    templateUrl: 'templates/follow.html',
    controller: 'followCtrl',
    params: {
      from: null,
      userid: null,
      type: null
    }
  })

  .state('comments', {
     url: '/comments',
     templateUrl: 'templates/comments.html',
     controller: 'commentsCtrl',
     params: {
      postid: null
    }
  })
  $urlRouterProvider.otherwise('/login')
});