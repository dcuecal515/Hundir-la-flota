import { Component } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { WebsocketService } from '../../services/websocket.service';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { jwtDecode } from "jwt-decode";
import { User } from '../../models/user';
import { Friend } from '../../models/Friend';
import { environment } from '../../../environments/environment.development';
import { FormsModule } from '@angular/forms';
import { SearchserviceService } from '../../services/searchservice.service';
import { FriendRequest } from '../../models/FriendRequest';
import { Request } from '../../models/Request';
import { RequestService } from '../../services/request.service';



@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.css'
})
export class MenuComponent {
  constructor(private apiService:ApiService,private router:Router,private webSocketService:WebsocketService,private searchServiceService:SearchserviceService, private requestService:RequestService){
    this.connectRxjs()
    if(localStorage.getItem("token")){
      this.decoded=jwtDecode(localStorage.getItem("token"));
    }else if(sessionStorage.getItem("token")){
      this.decoded=jwtDecode(sessionStorage.getItem("token"));
    }else{
      this.decoded=null
    }
    console.log("HOLAAAAAAAAA:"+this.decoded);
    this.reciveData()
    this.url=environment.images+this.decoded.Avatar;
  }

   
  connectRxjs() {
    this.type = 'rxjs';
    this.webSocketService.connectRxjs();
  }

  type:'rxjs'
  serverResponse: string = '';
  isConnected: boolean = false;
  connected$: Subscription;
  messageReceived$: Subscription;
  disconnected$: Subscription;
  decoded:User
  url:string
  name:String
  requestList:Request[] = []
  userList:Friend[]
  friendList:Friend[] = []



  ngOnInit(): void {
    this.connected$ = this.webSocketService.connected.subscribe(() => this.isConnected = true);
    this.messageReceived$ = this.webSocketService.messageReceived.subscribe(message => {
      if(message.message=="Has recibido una solicitud de amistad"){
        console.log("amistad")
        this.requestList.push(message)
      }
      if(message.message=="Te rechazaron"){
        console.log("rechazo")
        alert("Te rechazaron la solicitud de amistad")
      }
      if(message.message=="Añadido a lista de amigos"){
        console.log("nuevo amigo")
        alert("Ahora eres amigo de "+message.nickName)
        this.friendList.push(message)
      }
      this.serverResponse = message
    });
    this.disconnected$ = this.webSocketService.disconnected.subscribe(() => this.isConnected = false);
    // Pide los amigos que tiene el usuario
    // this.friendList = JSON.parse(this.serverResponse);*/
  }



  searchQuery:string = ""


  hola:Friend={nickName: "hOla"}
  adios:Friend={nickName:"adiós"}
  deleteToken(){
    this.apiService.deleteToken();
    this.webSocketService.disconnectRxjs();
    this.router.navigateByUrl("login");
  }
  ngOnDestroy(): void {
    this.connected$.unsubscribe();
    this.messageReceived$.unsubscribe();
    this.disconnected$.unsubscribe();
  }
  search(){
    const input = document.getElementById("search") as HTMLInputElement
    this.searchQuery = input.value
  }

  compare(nickname:string){
    if(this.searchQuery != ""){
      var newNick = nickname.toUpperCase()
      var upperQuery = this.searchQuery.toUpperCase()
      newNick = this.deleteAccents(newNick)
      upperQuery = this.deleteAccents(upperQuery)
      if(newNick.includes(upperQuery)){
        return true
      }
      else{
        return false
      }
    }
    else{
      return true
    }
  }

  deleteAccents(text:string){
    return text.replace("Á","A")
                .replace("É","E")
                .replace("Í","I")
                .replace("Ó","O")
                .replace("Ú","U")
  }


  async searchUser(){
    const recievename=this.name.trim()
    console.log(recievename)
    console.log(this.apiService.jwt);
    const result=await this.searchServiceService.search(recievename)
    console.log(result.data);
    this.userList = result.data
  }


  requestUser(nickName){
    if (nickName != "") {
      const User:FriendRequest={TypeMessage:"amistad" ,Identifier: nickName,Identifier2:null}
      // Convertir el objeto a JSON
      const jsonData = JSON.stringify(User);
      console.log(JSON.stringify(User));
      this.webSocketService.sendRxjs(jsonData);
    }
  }

  rejectUser(nickName){
    const newRequestList = this.requestList.filter(request => request.nickName !== nickName);
    this.requestList = newRequestList
    const message:FriendRequest={TypeMessage:"rechazar",Identifier:nickName}
    const jsonData = JSON.stringify(message)
    console.log(jsonData)
    this.webSocketService.sendRxjs(jsonData)
  }

  addUser(nickName){
    const newRequestList = this.requestList.filter(request => request.nickName !== nickName);
    this.requestList = newRequestList
    const message:FriendRequest={TypeMessage:"aceptar",Identifier:nickName}
    const jsonData = JSON.stringify(message)
    console.log(jsonData)
    this.webSocketService.sendRxjs(jsonData)
  }

  async reciveData(){
    var result = await this.requestService.receiveRequests()
    console.log(result.data)
    this.requestList = result.data;
  }
}
