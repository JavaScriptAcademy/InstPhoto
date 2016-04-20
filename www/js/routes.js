angular.module('app.routes', [])

.config(function($stateProvider, $urlRouterProvider) {

  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js
  $stateProvider

  .state('tabsController.home', {
    url: '/page2',
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

  .state('login', {
    url: '/login',
    templateUrl: 'templates/login.html',
    controller: 'loginCtrl'
  })

  .state('editPost', {
    url: '/editPost',
    templateUrl: 'templates/editPost.html',
    controller: 'editPostCtrl'
  })

  // .state('editPost', {
  //   url: '/page7',
  //   templateUrl: 'templates/shoot.html',
  //   controller: 'ImagePickerController'
  // })

$urlRouterProvider.otherwise('/page1/page2')



});