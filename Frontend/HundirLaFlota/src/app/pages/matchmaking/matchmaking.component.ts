import { Component,ViewChild,ElementRef } from '@angular/core';
import { WebsocketService } from '../../services/websocket.service';
import { Subscription } from 'rxjs';
import { Friend } from '../../models/Friend';
import { environment } from '../../../environments/environment';
import { Request } from '../../models/Request';
import { RequestService } from '../../services/request.service';
import { User } from '../../models/user';
import { jwtDecode } from 'jwt-decode';
import { Router } from '@angular/router';
import { DataService } from '../../services/data.service';
import { FriendRequest } from '../../models/FriendRequest';
import Swal from 'sweetalert2';
import { ApiService } from '../../services/api.service';
import { AuthserviceService } from '../../services/authservice.service';
import { UserReceived } from '../../models/UserReceived';

@Component({
  selector: 'app-matchmaking',
  standalone: true,
  imports: [],
  templateUrl: './matchmaking.component.html',
  styleUrl: './matchmaking.component.css'
})
export class MatchmakingComponent {
  constructor(private webSocketService:WebsocketService,private requestService:RequestService,private router:Router,private dataService:DataService,private apiService:ApiService, private authService:AuthserviceService){
    if(localStorage.getItem("token")){
          this.decoded=jwtDecode(localStorage.getItem("token"));
        }else if(sessionStorage.getItem("token")){
          this.decoded=jwtDecode(sessionStorage.getItem("token"));
        }else{
          router.navigateByUrl("login")
          this.decoded=null
        }
    window.addEventListener('beforeunload', this.beforeUnloadHandler);
    this.obtainuser()
  }
  conectedUsers:number = 0
  isConnected: boolean = false;
  messageReceived$: Subscription;
  disconnected$: Subscription;
  requestList:Request[] = []
  userList:Friend[]
  friendList:Friend[] = []
  serverResponse: string = '';
  gamemode:string="";
  decoded:User;
  user:UserReceived = null;
  partyRequestSended:string[] = []
  partyHost:Request = null
  partyGuest:Request = null
  isPlayingRamdon:boolean=false;

  private beforeUnloadHandler = (event: Event) => {
    if (this.partyRequestSended.length != 0) {
      this.partyRequestSended.forEach(nickName => {
        const message: FriendRequest = { TypeMessage: "sala finalizada", Identifier: nickName };
        const jsonData = JSON.stringify(message);
        console.log(jsonData);
        this.webSocketService.sendRxjs(jsonData);
      });
    } else {
      if (this.isPlayingRamdon) {
        const message: FriendRequest = { TypeMessage: "Cancelar busqueda de partida" };
        this.isPlayingRamdon = false;
        const jsonData = JSON.stringify(message);
        console.log(jsonData);
        this.webSocketService.sendRxjs(jsonData);
      } else if (this.partyHost.nickName == this.user.nickName) {
        const message: FriendRequest = { TypeMessage: "Abandono anfitrion", Identifier: this.partyGuest.nickName };
        const jsonData = JSON.stringify(message);
        console.log(jsonData);
        this.webSocketService.sendRxjs(jsonData);
      } else {
        const message: FriendRequest = { TypeMessage: "Abandono invitado", Identifier: this.partyHost.nickName };
        const jsonData = JSON.stringify(message);
        console.log(jsonData);
        this.webSocketService.sendRxjs(jsonData);
      }
    }
  };

  ngOnInit(): void {
    
      this.messageReceived$ = this.webSocketService.messageReceived.subscribe(async message => {
        if(message.message=="amigo conectado"){
          console.log("HOLAAAA")
          console.log("Ahora tu amigo se ha conectado:"+message.friendId)
          this.friendList.forEach(friend => {
            if(friend.id == message.friendId){
              friend.status="Conectado"
            }
          });
          this.dataService.players=message.quantity
          this.dataService.playersPlaying=message.quantityplayer
          this.dataService.games=message.quantitygame
        }
        if(message.message=="usuarios conectados"){
          console.log("La cantidad de usuarios que ahi ahora conectados son: "+message.quantity)
          this.dataService.players=message.quantity
          this.dataService.playersPlaying=message.quantityplayer
          this.dataService.games=message.quantitygame
        }
        if(message.message=="usuarios desconectados"){
          console.log("HOLAAAA")
          console.log("Se ha desconectado un usuario ahora quedan:"+message.quantity)
          this.dataService.players=message.quantity
          this.dataService.playersPlaying=message.quantityplayer
          this.dataService.games=message.quantitygame
        }
        if(message.message=="amigo desconectado"){
          console.log("Ahora tu amigo se ha desconectado:"+message.friendId)
          this.friendList.forEach(friend => {
            if(friend.id == message.friendId){
              friend.status="Desconectado"
            }
          });
          this.dataService.players=message.quantity
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
                                  Swal.fire("Confirmado", "Entrando a partida", "success");
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
        if(message.message=="Te rechazo la partida"){
          console.log(message.nickName+" te rezacho la partida")
          const newPartyRequestSended = this.partyRequestSended.filter(nickName => nickName !== message.nickName);
          this.partyRequestSended = newPartyRequestSended;
          console.log(this.partyRequestSended)
        }

        if(message.message=="Se unieron a tu lobby"){
          console.log("Se unió "+message.nickName)
          // Quita de la lista al que se ha unido
          const newPartyRequestSended = this.partyRequestSended.filter(nickName => nickName !== message.nickName);
          this.partyRequestSended = newPartyRequestSended;
          // Avisa a los demás que se ha cancelado la invitación
          this.partyRequestSended.forEach(nickName => {
            const message:FriendRequest={TypeMessage:"sala finalizada",Identifier:nickName}
            const jsonData = JSON.stringify(message)
            console.log(jsonData)
            this.webSocketService.sendRxjs(jsonData)
          });
          // Vacia la lista de invitaciones
          this.partyRequestSended = []
          // Guarda el anfitrion y el invitado
          this.partyHost = {
            id:this.decoded.id,
            nickName:this.user.nickName,
            avatar:this.user.avatar
          };
          message.avatar = environment.images+message.avatar
          this.partyGuest = message
        }

        if(message.message=="Te uniste a una lobby"){
          console.log("Te uniste a "+message.nickName)
          // Guarda el anfitrion y el invitado
          message.avatar = environment.images+message.avatar
          this.partyHost = message
          this.partyGuest = {
            id:this.decoded.id,
            nickName:this.user.nickName,
            avatar:this.user.avatar
          };
        }
        if(message.message=="Has sido eliminado de amigos"){
          console.log("Te eliminaron")
          const newFriendList = this.friendList.filter(friend => friend.nickName !== message.nickName);
          this.friendList = newFriendList;
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

        if(message.message=="Se salieron de tu lobby"){
          console.log("Se salió "+message.nickName)
          Swal.fire({
                    title: 'Se salió '+message.nickName+" de tu sala",
                    icon: 'info',
                    timer: 1000, 
                    showConfirmButton: false
                  });
          this.gamemode=""
          this.partyGuest = null
        }
        if(message.message=="Te volviste anfitrion"){
          console.log("Se salió "+message.nickName)
          Swal.fire({
            title: 'Se salió '+message.nickName+" ahora esta es tu sala",
            icon: 'info',
            timer: 1000, 
            showConfirmButton: false
          });
          this.gamemode=""
          this.partyGuest = null
          this.partyHost = {
            id:this.decoded.id,
            nickName:this.user.nickName,
            avatar:this.user.avatar
          };
        }
        if(message.message=="Empezo la partida"){
          console.log("Empezaste la partida con "+message.opponentId)
          this.router.navigateByUrl("game")
          const messageToSend:FriendRequest={TypeMessage:"Envio de oponentes",Identifier:message.opponentId.toString()}
          const jsonData = JSON.stringify(messageToSend)
          console.log(jsonData)
          this.webSocketService.sendRxjs(jsonData)
        }
        if(message.message=="Partida Aleatoria Encontrada"){
          this.router.navigateByUrl("game");
          const messageToSend:FriendRequest={TypeMessage:"Envio de oponentes",Identifier:message.opponentId.toString()}
          const jsonData = JSON.stringify(messageToSend)
          console.log(jsonData)
          this.webSocketService.sendRxjs(jsonData)
        }
        if(message.message=="Tu amigo se cambio el nombre"){
          this.friendList.forEach(friend => {
            if(friend.nickName==message.oldNickName){
              friend.nickName=message.newNickName
            }
          });
        }
        if(message.message=="Partida Encontrada"){
          this.router.navigateByUrl("game");
        }
        if(message.message=="Estas ya en la lista de busqueda"){
          console.log("No busques otra vez bobo");
        }

        if(message.message=="Ir a revancha con opotente anterior"){
          this.dataService.opponentName=message.nickName
          this.router.navigateByUrl("game")
        }

        if(message.message == "Datos iniciales"){
          console.log("Te enfrentas a "+message.nickName)
          this.dataService.opponentName = message.nickName
        }
        if(message.message=="Has sido baneado"){
          if(this.isPlayingRamdon==true){
            const message:FriendRequest={TypeMessage:"Cancelar busqueda de partida"}
            this.isPlayingRamdon=false
            const jsonData = JSON.stringify(message)
            console.log(jsonData)
            this.webSocketService.sendRxjs(jsonData)
          }
          if(this.partyGuest!=null){
            if(this.partyGuest.id==this.decoded.id){
              const message:FriendRequest={TypeMessage:"Abandono invitado",Identifier:this.partyHost.nickName}
              const jsonData = JSON.stringify(message)
              console.log(jsonData)
              this.webSocketService.sendRxjs(jsonData)
            }else{
              const message:FriendRequest={TypeMessage:"Abandono anfitrion",Identifier:this.partyGuest.nickName}
              const jsonData = JSON.stringify(message)
              console.log(jsonData)
              this.webSocketService.sendRxjs(jsonData)
            }
          }
          this.apiService.deleteToken();
          this.webSocketService.disconnectRxjs();
          this.router.navigateByUrl("/login");
        }
        
        this.serverResponse = message
      });
      this.disconnected$ = this.webSocketService.disconnected.subscribe(() =>{
        this.isConnected = false
      });
    }
    async obtainuser(){
      this.user = await this.authService.getUserById(this.decoded.id)
    }
    backToTheMenu(){
      this.router.navigateByUrl("menu");
    }
    gameBot(){
      this.gamemode="partywithbot";
      this.friendList=[]
      var body=document.getElementById("body")
      var buttons=document.getElementById("buttons")
      var buttonDesign=document.getElementById("button-design")
      var buttonDesign2=document.getElementById("button-design2")
      var buttonDesign3=document.getElementById("button-design3")
      body.classList.remove("body")
      body.classList.add("bodyview")
      buttons.classList.remove("buttons")
      buttons.classList.add("buttonsview")
      buttonDesign.classList.remove("button-design")
      buttonDesign.classList.add("button-design-view")
      buttonDesign2.classList.remove("button-design")
      buttonDesign2.classList.add("button-design-view")
      buttonDesign3.classList.remove("button-design")
      buttonDesign3.classList.add("button-design-view")
    }
    gameFriend(){
      this.gamemode="partywithfriend";
      this.friendList=[]
      this.recievFriend()
      var body=document.getElementById("body")
      var buttons=document.getElementById("buttons")
      var buttonDesign=document.getElementById("button-design")
      var buttonDesign2=document.getElementById("button-design2")
      var buttonDesign3=document.getElementById("button-design3")
      body.classList.remove("body")
      body.classList.add("bodyview")
      buttons.classList.remove("buttons")
      buttons.classList.add("buttonsview")
      buttonDesign.classList.remove("button-design")
      buttonDesign.classList.add("button-design-view")
      buttonDesign2.classList.remove("button-design")
      buttonDesign2.classList.add("button-design-view")
      buttonDesign3.classList.remove("button-design")
      buttonDesign3.classList.add("button-design-view")
    }
    gameRamdon(){
      this.gamemode="partywithrandom";
      this.friendList=[]
      var body=document.getElementById("body")
      var buttons=document.getElementById("buttons")
      var buttonDesign=document.getElementById("button-design")
      var buttonDesign2=document.getElementById("button-design2")
      var buttonDesign3=document.getElementById("button-design3")
      body.classList.remove("body")
      body.classList.add("bodyview")
      buttons.classList.remove("buttons")
      buttons.classList.add("buttonsview")
      buttonDesign.classList.remove("button-design")
      buttonDesign.classList.add("button-design-view")
      buttonDesign2.classList.remove("button-design")
      buttonDesign2.classList.add("button-design-view")
      buttonDesign3.classList.remove("button-design")
      buttonDesign3.classList.add("button-design-view")
    }
    async recievFriend(){
      var result = await this.requestService.receiveFriend()
      console.log(result.data)
      if(result.data != null){
        result.data.forEach(friend => {
          if(this.friendList.includes(friend)){
            console.log("NO ME AÑADO")
            return
          }else{
            friend.avatar = environment.images+friend.avatar
            if(friend.status=="Conectado"){
              this.friendList.push(friend);
            }
          }
        });
      }
    }
    playgame(){
      const message:FriendRequest={TypeMessage:"solicitud de partida contra bot"}
      const jsonData = JSON.stringify(message)
      console.log(jsonData)
      this.webSocketService.sendRxjs(jsonData)
    }
    sendInvite(nickName){
      var isRequested = false
      this.partyRequestSended.forEach(nickNameSaved => {
        if(nickNameSaved == nickName){
          isRequested = true
        }
      });
      if(!isRequested){
        const message:FriendRequest={TypeMessage:"solicitud de partida",Identifier:nickName}
        const jsonData = JSON.stringify(message)
        console.log(jsonData)
        this.webSocketService.sendRxjs(jsonData)
        this.partyRequestSended.push(nickName);
      }
    }

    exitGuest(){
      const message:FriendRequest={TypeMessage:"Abandono invitado",Identifier:this.partyHost.nickName}
      const jsonData = JSON.stringify(message)
      console.log(jsonData)
      this.webSocketService.sendRxjs(jsonData)
      this.router.navigateByUrl("menu")
    }
  
    exitHost(){
      const message:FriendRequest={TypeMessage:"Abandono anfitrion",Identifier:this.partyGuest.nickName}
      const jsonData = JSON.stringify(message)
      console.log(jsonData)
      this.webSocketService.sendRxjs(jsonData)
      this.router.navigateByUrl("menu")
    }

    startGame(){
      const message:FriendRequest={TypeMessage:"Empezar partida",Identifier:this.partyGuest.nickName}
      const jsonData = JSON.stringify(message)
      console.log(jsonData)
      this.webSocketService.sendRxjs(jsonData)
      this.router.navigateByUrl("game")
    }

    playGameRamdon(){
      const message:FriendRequest={TypeMessage:"Buscando Partida"}
      this.isPlayingRamdon=true
      const jsonData = JSON.stringify(message)
      console.log(jsonData)
      this.webSocketService.sendRxjs(jsonData)
      var idrecivido=document.getElementById("cancel")
      const buttonPlay = document.getElementById("button-play")
      buttonPlay.classList.remove("button-play")
      buttonPlay.classList.add("cancel")
      idrecivido.classList.remove("cancel")
      idrecivido.classList.add("cancelview")
      
    }
    cancelSearch(){
      const message:FriendRequest={TypeMessage:"Cancelar busqueda de partida"}
      this.isPlayingRamdon=false
      const jsonData = JSON.stringify(message)
      console.log(jsonData)
      this.webSocketService.sendRxjs(jsonData)
      var idrecivido=document.getElementById("cancel")
      const buttonPlay = document.getElementById("button-play")
      buttonPlay.classList.remove("cancel")
      buttonPlay.classList.add("button-play")
      idrecivido.classList.remove("cancelview")
      idrecivido.classList.add("cancel")
    }

    openlist(){
      if (this.friendList && this.friendList.length > 0) {
        let htmlContent = this.friendList.map(friend => 
          `<p>${friend.nickName} 
            <button id="invite-${friend.id}" 
                    style="background-color: #007bff; color: white; border: none; padding: 5px; border-radius: 5px; cursor: pointer;">
              Invitar a partida
            </button>
          </p>`
        ).join('');
  
        Swal.fire({
          title: 'Invitar Amigos',
          html: htmlContent,
          showCloseButton: true,
          showConfirmButton: false,
          didOpen: () => {  // Se ejecuta cuando el SweetAlert ha sido renderizado
            this.friendList.forEach(friend => {
              const button = document.getElementById(`invite-${friend.id}`);
              if (button) {
                button.addEventListener('click', () =>{
                  this.sendInvite(friend.nickName)
                  Swal.close()
                });
              }
            });
          }
        });
  
      } else {
        Swal.fire({
          title: 'Sin amigos disponibles',
          text: 'No tienes amigos en la lista para invitar.',
          icon: 'warning',
          confirmButtonText: 'Cerrar'
        });
      }
    }
  
    ngOnDestroy(): void {
      this.messageReceived$.unsubscribe();
      this.disconnected$.unsubscribe();
      window.removeEventListener('beforeunload', this.beforeUnloadHandler);
      if(this.partyRequestSended && this.partyRequestSended.length != 0){
        this.partyRequestSended.forEach(nickName => {
          const message:FriendRequest={TypeMessage:"sala finalizada",Identifier:nickName}
          const jsonData = JSON.stringify(message)
          console.log(jsonData)
          this.webSocketService.sendRxjs(jsonData)
        });
      }
    }
}
