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
import { RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
import { DataService } from '../../services/data.service';



@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [FormsModule,RouterLink],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.css'
})
export class MenuComponent {
  constructor(private apiService:ApiService,private router:Router,private webSocketService:WebsocketService,private searchServiceService:SearchserviceService, private requestService:RequestService,private dataService:DataService){
    if(localStorage.getItem("token")){
      this.decoded=jwtDecode(localStorage.getItem("token"));
    }else if(sessionStorage.getItem("token")){
      this.decoded=jwtDecode(sessionStorage.getItem("token"));
    }else{
      this.decoded=null
    }
    console.log("HOLAAAAAAAAA:"+this.decoded);
    this.reciveData()
    this.recievFriend()
    this.url=environment.images+this.decoded.Avatar;
    this.conectedUsers=this.dataService.players
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
  conectedUsers:number = 0



  ngOnInit(): void {
    this.messageReceived$ = this.webSocketService.messageReceived.subscribe(message => {
      if(message.message=="Has recibido una solicitud de amistad"){
        console.log("amistad")
        this.requestList.push(message)
      }
      if(message.message=="Te rechazaron"){
        console.log("rechazo")
      }
      if(message.message=="Añadido a lista de amigos"){
        console.log("nuevo amigo")
        message.avatar = environment.images+message.avatar
        this.friendList.push(message)
      }
      if(message.message=="Has sido eliminado de amigos"){
        console.log("Te eliminaron")
        const newFriendList = this.friendList.filter(friend => friend.nickName !== message.nickName);
        this.friendList = newFriendList;
      }
      if(message.message=="amigo conectado"){
        console.log("HOLAAAA")
        console.log("Ahora tu amigo se ha conectado:"+message.friendId)
        this.friendList.forEach(friend => {
          if(friend.id == message.friendId){
            friend.status="Conectado"
          }
        });
        this.conectedUsers=message.quantity
        this.dataService.players=message.quantity
      }
      if(message.message=="usuarios conectados"){
        console.log("La cantidad de usuarios que ahi ahora conectados son: "+message.quantity)
        this.conectedUsers=message.quantity
        this.dataService.players=message.quantity
      }
      if(message.message=="usuarios desconectados"){
        console.log("HOLAAAA")
        console.log("Se ha desconectado un usuario ahora quedan:"+message.quantity)
        this.conectedUsers=message.quantity
        this.dataService.players=message.quantity
      }
      if(message.message=="amigo desconectado"){
        console.log("Ahora tu amigo se ha desconectado:"+message.friendId)
        this.friendList.forEach(friend => {
          if(friend.id == message.friendId){
            friend.status="Desconectado"
          }
        });
        this.conectedUsers=message.quantity
        this.dataService.players=message.quantity
      }
      this.serverResponse = message
    });
    /*this.disconnected$ = this.webSocketService.disconnected.subscribe(() => this.isConnected = false);*/
  }



  searchQuery:string = ""


  hola:Friend={nickName: "hOla"}
  adios:Friend={nickName:"adiós"}
  deleteToken(){
    this.apiService.deleteToken();
    /*this.disconnected$.unsubscribe();*/
    this.webSocketService.disconnectRxjs();
    this.router.navigateByUrl("login");
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

  async deleteUser(nickName){
    const wantToDelete = await Swal.fire({
      title: "¿Estás seguro?",
      text: "Esta acción no se puede deshacer.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Eliminar",
      cancelButtonText: "Cancelar"
    });
    if (wantToDelete.isConfirmed) {
      Swal.fire("Confirmado", nickName+" ya no es tu amigo", "success");
      const newFriendList = this.friendList.filter(friend => friend.nickName !== nickName);
      this.friendList = newFriendList;
      const message:FriendRequest={TypeMessage:"eliminar",Identifier:nickName}
      const jsonData = JSON.stringify(message)
      console.log(jsonData)
      this.webSocketService.sendRxjs(jsonData)
    } else {
      Swal.fire("Cancelado", "La acción fue cancelada", "error");
    }
  }

  async reciveData(){
    var result = await this.requestService.receiveRequests()
    console.log(result.data)
    this.requestList = result.data;
  }

  async recievFriend(){
    var result = await this.requestService.receiveFriend()
    console.log(result.data)
    if(result.data != null){
      result.data.forEach(friend => {
        friend.avatar = environment.images+friend.avatar
      });
    }
    this.friendList = result.data
  }
  ngOnDestroy(): void {
    this.messageReceived$.unsubscribe();
  }
}
