import { Component } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { WebsocketService } from '../../services/websocket.service';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { jwtDecode } from "jwt-decode";
import { User } from '../../models/user';
import { Friend } from '../../models/Friend';
import { environment } from '../../../environments/environment';
import { FormsModule } from '@angular/forms';
import { SearchserviceService } from '../../services/searchservice.service';
import { FriendRequest } from '../../models/FriendRequest';
import { Request } from '../../models/Request';
import { RequestService } from '../../services/request.service';
import { RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
import { DataService } from '../../services/data.service';
import { AuthserviceService } from '../../services/authservice.service';
import { UserReceived } from '../../models/UserReceived';



@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [FormsModule,RouterLink],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.css'
})
export class MenuComponent {
  constructor(private apiService:ApiService,private router:Router,private webSocketService:WebsocketService,private searchServiceService:SearchserviceService, private requestService:RequestService,private dataService:DataService, private authService:AuthserviceService){
    if(localStorage.getItem("token")){
      this.decoded=jwtDecode(localStorage.getItem("token"));
    }else if(sessionStorage.getItem("token")){
      this.decoded=jwtDecode(sessionStorage.getItem("token"));
    }else{
      router.navigateByUrl("login")
      this.decoded=null
      
    }
    console.log("HOLAAAAAAAAA:"+this.decoded);
    this.reciveData()
    this.recievFriend()
    this.url=environment.images+this.decoded.Avatar;
    console.log(this.dataService.players)
    this.obtainuser()
    this.conectedUsers=this.dataService.players
    this.playingUsers=dataService.playersPlaying
    this.games=dataService.games
  }
  user:UserReceived
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
  conectedUsers:number
  playingUsers:number
  games:number=0
  isOpen:boolean = false

  ngOnInit(){
    this.messageReceived$ = this.webSocketService.messageReceived.subscribe(async message => {
      console.log("Mensaje recibido:", message);
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
        this.dataService.players=this.conectedUsers
        this.playingUsers=message.quantityplayer
        this.dataService.playersPlaying=message.quantityplayer
        this.games=message.quantitygame
        this.dataService.games=message.quantitygame
        
      }
      if(message.message=="usuarios conectados"){
        console.log("La cantidad de usuarios que ahi ahora conectados son: "+message.quantity)
        this.conectedUsers=message.quantity
        this.dataService.players=this.conectedUsers
        this.playingUsers=message.quantityplayer
        this.dataService.playersPlaying=message.quantityplayer
        this.games=message.quantitygame
        this.dataService.games=message.quantitygame
      }
      if(message.message=="usuarios desconectados"){
        console.log("HOLAAAA")
        console.log("Se ha desconectado un usuario ahora quedan:"+message.quantity)
        this.conectedUsers=message.quantity
        this.dataService.players=this.conectedUsers
        this.playingUsers=message.quantityplayer
        this.dataService.playersPlaying=message.quantityplayer
        this.games=message.quantitygame
        this.dataService.games=message.quantitygame
      }
      if(message.message=="amigo desconectado"){
        console.log("Ahora tu amigo se ha desconectado:"+message.friendId)
        this.friendList.forEach(friend => {
          if(friend.id == message.friendId){
            friend.status="Desconectado"
          }
        });
        this.conectedUsers=message.quantity
        this.dataService.players=this.conectedUsers
        this.playingUsers=message.quantityplayer
        this.dataService.playersPlaying=message.quantityplayer
        this.games=message.quantitygame
        this.dataService.games=message.quantitygame
      }
      if(message.message=="Has recibido una solicitud de partida"){
        console.log("Solicitud de partida de "+message.nickName)
        const playRequest = await Swal.fire({
                        title: "Solicitud de partida",
                        text: message.nickName+" te a invitado a jugar",
                        icon: "info",
                        showCancelButton: true,
                        confirmButtonText: "Aceptar",
                        cancelButtonText: "Cerrar"
                      });
                      if (playRequest.isConfirmed) {
                        Swal.fire("Aceptada", "Entrando a partida", "success");
                        this.router.navigate(['/matchmaking']);
                        const messageToSend:FriendRequest={TypeMessage:"Aceptar Partida",Identifier:message.nickName}
                        const jsonData = JSON.stringify(messageToSend)
                        console.log(jsonData)
                        this.webSocketService.sendRxjs(jsonData)
                      } else {
                        const messageToSend:FriendRequest={TypeMessage:"Rechazar Partida",Identifier:message.nickName}
                        const jsonData = JSON.stringify(messageToSend)
                        console.log(jsonData)
                        this.webSocketService.sendRxjs(jsonData)
                      }
      }
      if(message.message=="Se finalizo la partida"){
        Swal.close()
        Swal.fire("Cancelación", "Se canceló la invitación", "error");
      }
      if(message.message=="Has perdido"){
        console.log("Has perdido una partida contra ") // Añadir contra quien a perdido
      }
      if(message.message=="Tu amigo dejo de jugar"){
        this.friendList.forEach(friend => {
          if(friend.nickName==message.nickName){
            friend.status="Conectado"
          }
        });
      }
      if(message.message=="Tu amigo esta jugando"){
        this.friendList.forEach(friend => {
          if(friend.nickName==message.nickName){
            friend.status="Jugando"
          }
        });
      }
      if(message.message=="Jugadores jugando"){
        this.playingUsers=message.quantityplayer
        this.dataService.playersPlaying=message.quantityplayer
        this.games=message.quantitygame
        this.dataService.games=message.quantitygame
      }
      if(message.message=="Tu amigo se cambio el nombre"){
        this.friendList.forEach(friend => {
          if(friend.nickName==message.oldNickName){
            friend.nickName=message.newNickName
          }
        });
      }
      if(message.message=="Has sido baneado"){
        this.apiService.deleteToken();
        this.webSocketService.disconnectRxjs();
        this.router.navigateByUrl("/login");
      }
      this.serverResponse = message
    });
    this.disconnected$ = this.webSocketService.disconnected.subscribe(() => this.isConnected = false);
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

  async obtainuser(){
    this.user = await this.authService.getUserById(this.decoded.id)
  }
  goToProfile(id:number){
    const route: string = `profile/${id}`;
    this.router.navigateByUrl(route);
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
    this.disconnected$.unsubscribe();
  }

  open_close_dropdown(){
      var dropdown = document.getElementById("header-requests")
      if(this.isOpen && dropdown){
        this.isOpen = false
        dropdown.classList.remove("header-requests-closed");
        dropdown.classList.add("header-requests");
      }else{
        this.isOpen = true
        dropdown.classList.remove("header-requests");
        dropdown.classList.add("header-requests-closed");
      }
  }

  openAlert() {
    Swal.fire({
      title: 'Ingresa el nombre del usuario',
      input: 'text',
      inputPlaceholder: 'Escribe aquí...',
      showCancelButton: true,
      confirmButtonText: 'Aceptar',
      cancelButtonText: 'Cancelar',
    }).then(async (result) => {
      if (result.isConfirmed && result.value) {
        this.name = result.value;
        await this.searchUser();
        
        if (!this.userList || this.userList.length == 0) {
          Swal.fire('No existe este usuario');
          return;
        }
  
        let userHtml = '<div>';
        this.userList.forEach((user, index) => {
          userHtml += `<p>${user.nickName} `;
          if (user.message == 'no') {
            userHtml += `<button id="requestUserBtn${index}" class="swal2-confirm swal2-styled">Enviar solicitud</button>`;
          }
          userHtml += `<button id="profileBtn${index}" class="swal2-confirm swal2-styled">Perfil</button></p>`;
        });
        userHtml += '</div>';
  
        Swal.fire({
          title: 'Lista de Usuarios',
          html: userHtml,
          showCloseButton: true,
          showConfirmButton: false,
          didOpen: () => {
            this.userList.forEach((user, index) => {
              const requestBtn = document.getElementById(`requestUserBtn${index}`);
              const profileBtn = document.getElementById(`profileBtn${index}`);
  
              if (requestBtn) {
                requestBtn.addEventListener('click', () => {
                  this.requestUser(user.nickName);
                  Swal.close();
                });
              }
  
              if (profileBtn) {
                profileBtn.addEventListener('click', () => {
                  this.goToProfile(user.id);
                  Swal.close();
                });
              }
            });
          }
        });
      }
    });
  }

}
