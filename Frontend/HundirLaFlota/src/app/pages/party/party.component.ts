import { Component } from '@angular/core';
import { WebsocketService } from '../../services/websocket.service';
import { RequestService } from '../../services/request.service';
import { jwtDecode } from 'jwt-decode';
import { Router } from '@angular/router';
import { DataService } from '../../services/data.service';
import { User } from '../../models/user';
import { delay, Subscription } from 'rxjs';
import { FriendRequest } from '../../models/FriendRequest';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-party',
  standalone: true,
  imports: [],
  templateUrl: './party.component.html',
  styleUrl: './party.component.css'
})
export class PartyComponent {
  constructor(private webSocketService:WebsocketService,private requestService:RequestService,private router:Router,private dataService:DataService){
      if(localStorage.getItem("token")){
            this.decoded=jwtDecode(localStorage.getItem("token"));
          }else if(sessionStorage.getItem("token")){
            this.decoded=jwtDecode(sessionStorage.getItem("token"));
          }else{
            this.decoded=null
          }
  }
  decoded:User;
  messageReceived$: Subscription;
  disconnected$: Subscription;
  isConnected: boolean = false;
  opponentName:string = "Bot1"
  items=[1,2,3,4,5,6,7,8,9,10]
  letras=['a','b','c','d','e','f','g','h','i','j']
  ships=[]
  shoots=[]
  barcosoponente=false
  turn=false
  impacted=false
  timeSeconds:number=120
  timeString:string="2:00"
  stopTimer = false
  timerInterval: any

  ngOnInit(): void {
    this.messageReceived$ = this.webSocketService.messageReceived.subscribe(async message => {
      if(message.message == "Datos iniciales"){
        console.log("Te enfrentas a "+message.nickName)
        this.opponentName = message.nickName
      }
      if(message.message=="Empezo la partida"){
        console.log("Empezaste la partida con "+message.opponentId)
        const messageToSend:FriendRequest={TypeMessage:"Envio de oponentes",Identifier:message.opponentId.toString()}
        const jsonData = JSON.stringify(messageToSend)
        console.log(jsonData)
        this.webSocketService.sendRxjs(jsonData)
      }
      if(message.message=="Has ganado"){
        console.log("has ganado contra "+this.opponentName)
        this.router.navigateByUrl("menu")
      }
      if(message.message=="Disparo enemigo"){
        console.log("Te dispararon en la posición: "+message.position)
        this.ships.forEach(ship => {
          ship.forEach(position => {
            if(position == message.position){
              this.impacted=true
              position="tocado"
              const messageToSend:FriendRequest={TypeMessage:"Dado en el blanco",Identifier:this.opponentName,Identifier2:message.position}
              const jsonData = JSON.stringify(messageToSend)
              console.log(jsonData)
              this.webSocketService.sendRxjs(jsonData)
            }
          });
        });
        if(!this.impacted){
          const messageToSend:FriendRequest={TypeMessage:"Agua",Identifier:this.opponentName,Identifier2:message.position}
          const jsonData = JSON.stringify(messageToSend)
          console.log(jsonData)
          this.webSocketService.sendRxjs(jsonData)
        }else{
          this.impacted=false
        }
        Swal.fire({
          title: 'Te toca disparar',
          icon: 'success',
          timer: 1000, 
          showConfirmButton: false
        });
        this.turn=true
      }
      if(message.message=="Tocado"){
        console.log("Has dado al barco con posición: "+message.position)
        var gamebox=document.getElementById(message.position)
        gamebox.classList.remove("game-box")
        gamebox.classList.add("game-box-touched")
      }
      if(message.message=="Fallo"){
        console.log("Has fallado en la posición: "+message.position)
        var gamebox=document.getElementById(message.position)
        gamebox.classList.remove("game-box")
        gamebox.classList.add("game-box-miss")
      }
      if(message.message=="Se te acabo el tiempo"){
        console.log("Se te ha acabado el tiempo")
        this.router.navigateByUrl("menu")
        const messageToSend:FriendRequest={TypeMessage:"Abandono de partida",Identifier:this.opponentName}
        const jsonData = JSON.stringify(messageToSend)
        console.log(jsonData)
        this.webSocketService.sendRxjs(jsonData)
      }
      if(message.message=="Tu oponente coloco los barcos primero"){
        console.log("Tu oponete es mas rapido")
        this.barcosoponente=true
      }
    });
    this.disconnected$ = this.webSocketService.disconnected.subscribe(() => this.isConnected = false);
    this.startTimer()
  }

  guardarposicion(letra:string,item:number){
    if(this.barcosoponente && this.ships.length > 0 && this.turn){
      var miposicion:string=letra+item
      if(!this.shoots.includes(miposicion)){
        this.shoots.push(miposicion)
        var gamebox=document.getElementById(miposicion)
        gamebox.classList.remove("game-box")
        gamebox.classList.add("game-box-view")
        console.log("Posición mandada: "+miposicion)
        const messageToSend:FriendRequest={TypeMessage:"Disparo",Identifier:this.opponentName,Identifier2:miposicion}
        const jsonData = JSON.stringify(messageToSend)
        console.log(jsonData)
        this.webSocketService.sendRxjs(jsonData)
        this.turn = false
      }else{
        Swal.fire({
          title: 'Error',
          text: 'Selecciona una posicion nueva',
          icon: 'error',
          timer: 1000,
          showConfirmButton: false
        });
      }
    }else{
      Swal.fire({
        title: 'Error',
        text: 'Todavia no puedes atacar',
        icon: 'error',
        timer: 1000, 
        showConfirmButton: false
      });
    }
    
  }

  async exit(){
    const exitRequest = await Swal.fire({
                            title: "Abandonar partida",
                            text: "¿Estás seguro que quieres abandonar la partida?",
                            icon: "warning",
                            showCancelButton: true,
                            confirmButtonText: "Aceptar",
                            cancelButtonText: "Cancelar"
                          });
                          if (exitRequest.isConfirmed) {
                            this.router.navigateByUrl("menu")
                            const messageToSend:FriendRequest={TypeMessage:"Abandono de partida",Identifier:this.opponentName}
                            const jsonData = JSON.stringify(messageToSend)
                            console.log(jsonData)
                            this.webSocketService.sendRxjs(jsonData)
                          } else {
                            Swal.close()
                          }
    
  }

  async startTimer(){
    this.stopTimer = false
    this.timeSeconds=120
    this.timeString="2:00"
    this.timerInterval = setInterval(() => {
      if (this.stopTimer || this.timeSeconds <= 0) {
        clearInterval(this.timerInterval);
        return;
      }
  
      this.timeSeconds--; // Reducir el tiempo
      const minutes = Math.floor(this.timeSeconds / 60);
      const seconds = this.timeSeconds % 60;
      this.timeString = minutes + ":" + seconds.toString().padStart(2, '0');
    }, 1000);
  }

  stopTimerfuction(){
    this.stopTimer = true
    if(this.barcosoponente){
      const messageToSend:FriendRequest={TypeMessage:"Yo tambien los coloque",Identifier:this.opponentName}
      const jsonData = JSON.stringify(messageToSend)
      console.log(jsonData)
      this.webSocketService.sendRxjs(jsonData)
    }else{
      const messageToSend:FriendRequest={TypeMessage:"He colocado mis barcos",Identifier:this.opponentName}
      const jsonData = JSON.stringify(messageToSend)
      console.log(jsonData)
      this.webSocketService.sendRxjs(jsonData)
    }
    
  }

  ngOnDestroy(): void {
    this.messageReceived$.unsubscribe();
    this.disconnected$.unsubscribe();
  }

}
