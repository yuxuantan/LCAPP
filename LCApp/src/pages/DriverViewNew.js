// This page will display 'New' jobs assigned to the driver


console.disableYellowBox = true;
// import PushController from '../util/PushController';
// import PushNotification from 'react-native-push-notification';

import React, { Component, PropTypes } from 'react';
import { 
  Platform,
  View, 
  Text, 
  TouchableHighlight, 
  TextInput, 
  Alert, 
  ListView, 
  ToastAndroid,
  AppState,
  Linking,
  AlertIOS,
 } from 'react-native';
// import {Actions} from 'react-native-router-flux';


import StatusBar from '../components/StatusBar';

import styles from '../styles/styles.js';
import ListItem from '../components/ListItem';
// import prompt from 'react-native-prompt-android';
import Prompt from 'react-native-prompt';

//import AddJob from './AddJob';
import DriverViewAccepted from './DriverViewAccepted';
import DriverViewCollected from './DriverViewCollected';
import DriverViewCompleted from './DriverViewCompleted';

import Login from './Login';
import ActionButton from '../components/ActionButton';
import ActionButton2 from '../components/ActionButton2';

var Toast = require('@remobile/react-native-toast');

export default class DriverViewNew extends Component {

  constructor(props) {
    super(props);

    this.itemsRef = this.props.firebaseApp.database().ref("jobs").orderByChild("preferredPickupDate");
    this.jobsRef = this.props.firebaseApp.database().ref("jobs");
    this.usersRef = this.props.firebaseApp.database().ref("users");

    this.state = {
      user: this.props.firebaseApp.auth().currentUser,
      loading: true,      
      dataSource: new ListView.DataSource({
        rowHasChanged: (row1, row2) => row1 !== row2,
      }),
      promptVisible: false,
      selectedJob: null,
      firstName: '',
    }

    // this.handleAppStateChange = this.handleAppStateChange.bind(this);

  }

  componentWillMount(){
      this.usersRef.on('value', (snap) => {
        snap.forEach((child) => {
          if(child.val().email==this.state.user.email){
              this.setState({firstName:child.val().firstName});
          }
        });
      });
  }
  componentDidMount() {
    this.listenForItems(this.itemsRef);
    // const userData = this.props.firebaseApp.auth().currentUser;
    this.setState({
      // user: userData,
      loading: false
    });

    AppState.addEventListener('change',this.handleAppStateChange);

  }

  componentWillUnmount(){
    AppState.removeEventListener('change',this.handleAppStateChange);
  }

  handleAppStateChange(appState){
    // let date = new Date(Date.now() + (3 * 1000));
    // if(Platform.OS === 'ios'){
    //   date = date.toISOString();
    // }
    // if(appState === 'background'){
    //   PushNotification.localNotificationSchedule({
    //     message: "My Notification Message", 
    //     date,
    //   });
    //   console.log('app is in background');
    // }
  }


  render() {
    return (      
      <View style={styles.container}>
        
        <Prompt
            title="Enter reason for rejection"
            placeholder=""
            defaultValue=""
            visible={this.state.promptVisible}
            onCancel={() => this.setState({ promptVisible: false, })}
            onSubmit={(value) => this._rejectJob(this.state.selectedJob, value) }/>
        <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center'}}>
          <TouchableHighlight style={{padding: 15}}>
            <Text style={styles.primaryButtonText}>            </Text>
          </TouchableHighlight>
          <Text style={styles.navbarTitle}>New Jobs</Text>          

          <TouchableHighlight onPress={this.logout.bind(this)} style={{margin: 0, padding: 15, backgroundColor: '#808080'}}>
            <Text style={styles.primaryButtonText}>Logout</Text>
          </TouchableHighlight>
          
        </View>



        <ListView dataSource={this.state.dataSource} 
                  renderRow={this._renderItem.bind(this)}
                  style={styles.listview} enableEmptySections={true}/>
        
        <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'flex-end', alignContent: 'center'}}>
         <ActionButton title="New"/>
          <ActionButton2 title="Accepted" onPress={this.goToDriverViewAccepted.bind(this)}/>
          <ActionButton2 title="Collected" onPress={this.goToDriverViewCollected.bind(this)}/>    
          <ActionButton2 title="Completed" onPress={this.goToDriverViewCompleted.bind(this)}/>    
        </View>

      </View>

    );
  }

   listenForItems(itemsRef) {
    itemsRef.on('value', (snap) => {

      // get children as an array
      var items = [];
      snap.forEach((child) => {

        if(child.val().status=='New' && (child.val().driver==this.state.firstName||child.val().driver=="ALL")){//this.state.user.email.substring(0,this.state.user.email.indexOf("@"))){
          items.push({
            jobId: child.val().jobId,
            name: child.val().name, 
            contactNo:child.val().contactNo,
            address: child.val().address + " " + child.val().postalCode,
            turnaround: child.val().turnaround, //Show
            type: child.val().type, 
            item: child.val().item,
            remarks: child.val().remarks, //Show
            email: child.val().email, 
            preferredPickupDate: child.val().preferredPickupDate, //Show
            preferredPickupTime: child.val().preferredPickupTime, //Show 
            status: child.val().status,
            invoiceNo: child.val().invoiceNo,
            driver: child.val().driver,
            amount: child.val().amount,
            _key: child.key
          });
        }
      });
      
      this.setState({
        dataSource: this.state.dataSource.cloneWithRows(items)
      });
      
    });
  }

   _renderItem(item) {

      const onPress = () => {
        Alert.alert(
          'Details for Job ID: '+ item.jobId,
          'Customer Name: '+ item.name 
            + '\nAddress: ' + item.address             
            + "\nContact Number: " + item.contactNo
            // + "\nTitle: " + item.title
            + "\nTurnaround: " + item.turnaround
            + "\nType: " + item.type
            + "\nItem: " + item.item
            + "\nPreferred Pickup Date: " + item.preferredPickupDate
            + "\nPreferred Pickup Time: " + item.preferredPickupTime
            + "\nRemarks: " + item.remarks
            ,
          [
            {text: 'Reject', onPress: () => this._popupRejectionReasonInput(item)},
            {text: 'Call/Navigate', onPress: () => this._openCallMap(item)},
            {text: 'Accept', onPress: () => this._acceptJob(item)},
            {text: 'Cancel'}

          ],
          'default'
        );
      };

      if(item.status=='New' && (item.driver==this.state.firstName||item.driver=="ALL")){//.user.email.substring(0,this.state.user.email.indexOf("@"))){
        return (
          <ListItem item={item} onPress={onPress}/>
        );
      }
      else{
        return(null);
      }  
    }

    _openCallMap(item){
      Alert.alert(
        'Please choose your action for job ID '+ item.jobId,
        'Customer Name: '+ item.name 
        + '\nAddress: ' + item.address  
        + "\nContact Number: " + item.contactNo,
        [
          // null,
          {text: 'Cancel'},
          {text: 'Call', onPress: () => Linking.openURL('tel:'+ encodeURIComponent(item.contactNo))},          
          {text: 'Navigate', onPress: () => Linking.openURL('https://maps.google.com?q='+item.address)},
        ],
        'default'
        );

//       AlertIOS.alert(
//  'Sync Complete',
//  'All your data are belong to us.'
// );
    }
// GO TO
    goToDriverViewAccepted(){
    this.props.navigator.push({
      component: DriverViewAccepted
    });
  }

  goToDriverViewCompleted(){
    this.props.navigator.push({
      component: DriverViewCompleted
    });
  }

  goToDriverViewCollected(){
    this.props.navigator.push({
      component: DriverViewCollected
    });
  }



  // ACTIONS
  _acceptJob(item){
    this.jobsRef.child(item._key).update({                          
                          status: 'Accepted'})

    // ToastAndroid.show('The job has been accepted !', ToastAndroid.LONG);
    if(Platform.OS === 'ios'){
      Toast.showLongBottom("The job has been accepted!");
    }
    else{
      ToastAndroid.show('The job has been accepted !', ToastAndroid.LONG);
    }

  }

  _rejectJob(item, reason){

    this.jobsRef.child(item._key).update({                          
                          status: 'Rejected', reason: reason});
    // Alert.alert("The job has been rejected");
    
    this.setState({promptVisible: false});

    if(Platform.OS === 'ios'){
      Toast.showLongBottom("The job has been rejected!");
    }
    else{
      ToastAndroid.show('The job has been rejected !', ToastAndroid.LONG);
    }

  }

  _popupRejectionReasonInput(item){
        this.setState({ promptVisible: true, selectedJob: item});
      }

  logout() {
    // logout, once that is complete, return the user to the login screen.
    this.props.firebaseApp.auth().signOut().then(() => {
      this.props.navigator.push({
        component: Login
      });
    });
  }

}