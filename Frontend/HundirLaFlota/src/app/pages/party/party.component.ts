import { Component,AfterViewInit } from '@angular/core';

@Component({
  selector: 'app-party',
  standalone: true,
  imports: [],
  templateUrl: './party.component.html',
  styleUrl: './party.component.css'
})
export class PartyComponent implements AfterViewInit {

  items=[1,2,3,4,5,6,7,8,9,10]
  letras=['a','b','c','d','e','f','g','h','i','j']
  barcos:string[][]=[]
  barcosoponente=[]
  barco:string[]=[]
  altura:number
  ancho:number
  quitar:boolean=false
  ngAfterViewInit() {
    const dropzones = document.querySelectorAll('.game-box');
    const draggablebarco4 = document.getElementById('barco4');
    const draggablebarco3=document.getElementById('barco3')
    const draggablebarco32=document.getElementById('barco32')
    const draggablebarco2=document.getElementById('barco2')
    draggablebarco4.addEventListener('dragstart', (event) => {
      console.log(event)
      this.altura=event.offsetY
      this.ancho=event.offsetX
      console.log('La posición del clic (altura) dentro del div es: ', this.altura);
      console.log('La posición del clic (anchura) dentro del div es: ',this.ancho)
      console.log('Altura total del div: ', draggablebarco4.offsetHeight);
      console.log('Anchura total del div: ',draggablebarco4.offsetWidth);
      event.dataTransfer.setData('text/plain', draggablebarco4.id);
      console.log('Estoy arrastrando mi elemento');
    });
    draggablebarco3.addEventListener('dragstart', (event) => {
      console.log(event)
      this.altura=event.offsetY
      this.ancho=event.offsetX
      console.log('La posición del clic (altura) dentro del div es: ', this.altura);
      console.log('La posición del clic (anchura) dentro del div es: ',this.ancho)
      console.log('Altura total del div: ', draggablebarco3.offsetHeight);
      console.log('Anchura total del div: ',draggablebarco3.offsetWidth);
      event.dataTransfer.setData('text/plain', draggablebarco3.id);
      console.log('Estoy arrastrando mi elemento');
    });
    draggablebarco32.addEventListener('dragstart', (event) => {
      console.log(event)
      this.altura=event.offsetY
      this.ancho=event.offsetX
      console.log('La posición del clic (altura) dentro del div es: ', this.altura);
      console.log('La posición del clic (anchura) dentro del div es: ',this.ancho)
      console.log('Altura total del div: ', draggablebarco32.offsetHeight);
      console.log('Anchura total del div: ',draggablebarco32.offsetWidth);
      event.dataTransfer.setData('text/plain', draggablebarco32.id);
      console.log('Estoy arrastrando mi elemento');
    });
    draggablebarco2.addEventListener('dragstart', (event) => {
      console.log(event)
      this.altura=event.offsetY
      this.ancho=event.offsetX
      console.log('La posición del clic (altura) dentro del div es: ', this.altura);
      console.log('La posición del clic (anchura) dentro del div es: ',this.ancho)
      console.log('Altura total del div: ', draggablebarco2.offsetHeight);
      console.log('Anchura total del div: ',draggablebarco2.offsetWidth);
      event.dataTransfer.setData('text/plain', draggablebarco2.id);
      console.log('Estoy arrastrando mi elemento');
    });
    dropzones.forEach(dropzone => {
      dropzone.addEventListener("dragover", (ev:DragEvent) => ev.preventDefault());
      dropzone.addEventListener("drop", (ev:DragEvent) => {
        const idelemento = ev.dataTransfer.getData("text/plain");
        /*const item = document.querySelector("#" + idelemento);*/
        const Idsuelto=dropzone.id
        const padre=document.getElementById(idelemento)
        const hijos=padre.children
        const clase=padre.className
        let numero
        console.log("Mis hijos len: "+hijos.length)
        console.log("MI ID ES: ",idelemento)
        console.log("Mis hijos son",hijos)
        console.log("Mi clase del padre",clase)
        console.log('posicon donde he soltado mi barco', Idsuelto);
        console.log('altura a donde pincho '+this.altura)
        if(clase=="barco4-column"||clase=="barco3-column" ||clase=="barco32-column"||clase=="barco2-column"){
          this.quitar=false
          if(this.altura>0 && this.altura<=54){
            console.log("Pongo la posicion uno")
            console.log("Esta seria mi letra"+Idsuelto[0])
            if(hijos.length==4 && (Idsuelto[0]=="j" || Idsuelto[0]=="h" || Idsuelto[0]=="i")){
              alert("No puedes colocar el barco aqui no hay espacio suficiente")
              return
            }else if(hijos.length==3 && (Idsuelto[0]=="j" || Idsuelto[0]=="i")){
              alert("No puedes colocar el barco aqui no hay espacio suficiente")
              return
            }else{
              const letra=Idsuelto[0]
            if(Idsuelto.length<3){
              numero=Idsuelto[1]
            }else{
              numero=Idsuelto[1]+Idsuelto[2]
            }
            this.barco = [];
            this.barco.push(Idsuelto)
            let indice=this.letras.indexOf(letra)
            for(let i=0; i<hijos.length-1; i++){
              indice+=1
              let letra=this.letras[indice]
              console.log(letra)
              let posicion=letra+numero
              console.log(posicion)
              this.barco.push(posicion)
            }
            console.log("Mi barco es: "+this.barco)
            let terminar=false
            if(this.barcos.length>=1){
              console.log("ENTREEEEE")
              this.barcos.forEach(barcoposiciones => {
                console.log("ENTRREEEEEEE")
                barcoposiciones.forEach(posicion => {
                  console.log("ENTRRREEEEEE")
                  if(this.barco.includes(posicion)){
                    console.log("ENTRRRRRREEEEEEEEE")
                    alert("Has puesto el barco en una posicion donde ya ahi un barco ponlo en otro lado pendejo")
                    terminar=true
                  }
                });
              });
              console.log(terminar)
              if(!terminar){
                this.barcos.push(this.barco)
                for(let i=0; i<hijos.length; i++){
                  let posicion=document.getElementById(this.barco[i])
                  posicion.style.background='grey'
                }
                this.quitar=true
              }
            }else{
              this.barcos.push(this.barco)
              for(let i=0; i<hijos.length; i++){
                let posicion=document.getElementById(this.barco[i])
                posicion.style.background='grey'
              }
              this.quitar=true
            }
            console.log(this.quitar)
            console.log("Mi lista de barcos: ",this.barcos)
            }
          }
          if(this.altura>54 && this.altura<=108){
            console.log("Pongo la posicion dos")
            console.log("Esta seria mi letra"+Idsuelto[0])
            if(Idsuelto[0]=="a" || Idsuelto[0]=="j" || Idsuelto[0]=="i"){
              alert("No puedes colocar el barco aqui no hay espacio suficiente")
              return
            }else{
              const letra=Idsuelto[0]
            if(Idsuelto.length<3){
              numero=Idsuelto[1]
            }else{
              numero=Idsuelto[1]+Idsuelto[2]
            }
            this.barco = [];
            let indice=this.letras.indexOf(letra)
            this.barco.push(this.letras[indice-1]+numero)
            this.barco.push(Idsuelto)
            if(hijos.length<4){
              this.barco.push(this.letras[indice+1]+numero)
            }else{
              for(let i=0; i<2; i++){
                indice+=1
                let letra=this.letras[indice]
                console.log(letra)
                let posicion=letra+numero
                console.log(posicion)
                this.barco.push(posicion)
              }
            }
            console.log("Mi barco es: "+this.barco)
            let terminar=false
            if(this.barcos.length>=1){
              console.log("ENTREEEEE")
              this.barcos.forEach(barcoposiciones => {
                console.log("ENTRREEEEEEE")
                barcoposiciones.forEach(posicion => {
                  console.log("ENTRRREEEEEE")
                  if(this.barco.includes(posicion)){
                    console.log("ENTRRRRRREEEEEEEEE")
                    alert("Has puesto el barco en una posicion donde ya ahi un barco ponlo en otro lado pendejo")
                    terminar=true
                  }
                });
              });
              console.log(terminar)
              if(!terminar){
                this.barcos.push(this.barco)
                for(let i=0; i<hijos.length; i++){
                  let posicion=document.getElementById(this.barco[i])
                  posicion.style.background='grey'
                }
                this.quitar=true
              }
            }else{
              this.barcos.push(this.barco)
              for(let i=0; i<hijos.length; i++){
                let posicion=document.getElementById(this.barco[i])
                posicion.style.background='grey'
              }
              this.quitar=true
            }
            console.log(this.quitar)
            console.log("Mi lista de barcos: "+this.barcos)
            }
            
          }
          if(this.altura>108 && this.altura<=162){
            console.log("Pongo la posicion tres")
            if(hijos.length==4 && (Idsuelto[0]=="a" || Idsuelto[0]=="j" || Idsuelto[0]=="b")){
              alert("No puedes colocar el barco aqui no hay espacio suficiente")
              return
            }else if(hijos.length==3 && (Idsuelto[0]=="a" || Idsuelto[0]=="b")){
              alert("No puedes colocar el barco aqui no hay espacio suficiente")
              return
            }else{
              let posicionesanteriores=[]
            console.log("Esta seria mi letra"+Idsuelto[0])
            const letra=Idsuelto[0]
            if(Idsuelto.length<3){
              numero=Idsuelto[1]
            }else{
              numero=Idsuelto[1]+Idsuelto[2]
            }
            this.barco = [];
            let indice=this.letras.indexOf(letra)
            let indicesecundario=this.letras.indexOf(letra)
            for(let i=0; i<2; i++){
              indicesecundario-=1
              let letra=this.letras[indicesecundario]
              console.log(letra)
              let posicion=letra+numero
              console.log(posicion)
              posicionesanteriores.push(posicion)
            }
            posicionesanteriores=posicionesanteriores.reverse()
            for(let i=0; i<2; i++){
              this.barco.push(posicionesanteriores[i])
            }
            this.barco.push(Idsuelto)
            if(hijos.length>=4){
              this.barco.push(this.letras[indice+1]+numero)
            }
            let terminar=false
            if(this.barcos.length>=1){
              console.log("ENTREEEEE")
              this.barcos.forEach(barcoposiciones => {
                console.log("ENTRREEEEEEE")
                barcoposiciones.forEach(posicion => {
                  console.log("ENTRRREEEEEE")
                  if(this.barco.includes(posicion)){
                    console.log("ENTRRRRRREEEEEEEEE")
                    alert("Has puesto el barco en una posicion donde ya ahi un barco ponlo en otro lado pendejo")
                    terminar=true
                  }
                });
              });
              console.log(terminar)
              if(!terminar){
                this.barcos.push(this.barco)
                for(let i=0; i<hijos.length; i++){
                  let posicion=document.getElementById(this.barco[i])
                  posicion.style.background='grey'
                }
                this.quitar=true
              }
            }else{
              this.barcos.push(this.barco)
              for(let i=0; i<hijos.length; i++){
                let posicion=document.getElementById(this.barco[i])
                posicion.style.background='grey'
              }
              this.quitar=true
            }
            console.log(this.quitar)
            console.log("Mi lista de barcos: "+this.barcos)
            }
          }
          if(this.altura>162 && this.altura<=220){
            console.log("pongo la posicion cuatro")
            if(Idsuelto[0]=="a"|| Idsuelto[0]=="b" || Idsuelto[0]=="c"){
              alert("No puedes colocar el barco aqui no hay espacio suficiente")
              return
            }else{
              let posicionesanteriores=[]
            console.log("Esta seria mi letra"+Idsuelto[0])
            const letra=Idsuelto[0]
            if(Idsuelto.length<3){
              numero=Idsuelto[1]
            }else{
              numero=Idsuelto[1]+Idsuelto[2]
            }
            this.barco = [];
            let indice=this.letras.indexOf(letra)
            for(let i=0; i<3; i++){
              indice-=1
              let letra=this.letras[indice]
              console.log(letra)
              let posicion=letra+numero
              console.log(posicion)
              posicionesanteriores.push(posicion)
            }
            posicionesanteriores=posicionesanteriores.reverse()
            for(let i=0; i<3; i++){
              this.barco.push(posicionesanteriores[i])
            }
            this.barco.push(Idsuelto)
            console.log("Mi barco es: "+this.barco)
            let terminar=false
            if(this.barcos.length>=1){
              console.log("ENTREEEEE")
              this.barcos.forEach(barcoposiciones => {
                console.log("ENTRREEEEEEE")
                barcoposiciones.forEach(posicion => {
                  console.log("ENTRRREEEEEE")
                  if(this.barco.includes(posicion)){
                    console.log("ENTRRRRRREEEEEEEEE")
                    alert("Has puesto el barco en una posicion donde ya ahi un barco ponlo en otro lado pendejo")
                    terminar=true
                  }
                });
              });
              console.log(terminar)
              if(!terminar){
                this.barcos.push(this.barco)
                for(let i=0; i<hijos.length; i++){
                  let posicion=document.getElementById(this.barco[i])
                  posicion.style.background='grey'
                }
                this.quitar=true
              }
            }else{
              this.barcos.push(this.barco)
              for(let i=0; i<hijos.length; i++){
                let posicion=document.getElementById(this.barco[i])
                posicion.style.background='grey'
              }
              this.quitar=true
            }
            console.log(this.quitar)
            console.log("Mi lista de barcos: "+this.barcos)
          }
          } 
        }
        if(clase=="barco4-row"||clase=="barco3-row"||clase=="barco32-row"||clase=="barco2-row"){
          this.quitar=false
          if(this.ancho>0 && this.ancho<=54){
            console.log("Pongo la posicion uno")
            console.log("Esta seria mi letra: "+Idsuelto[0])
            const letra=Idsuelto[0]
            if(Idsuelto.length<3){
              numero=Idsuelto[1]
            }else{
              numero=Idsuelto[1]+Idsuelto[2]
            }
            if(hijos.length==4 && (numero=="10" || numero=="9" || numero=="8")){
              alert("No puedes colocar el barco aqui no hay espacio suficiente")
              return
            }else if(hijos.length==3 && (numero=="10" || numero=="9")){
              alert("No puedes colocar el barco aqui no hay espacio suficiente")
              return
            }else{
              this.barco = [];
            this.barco.push(Idsuelto)
            let numeroint=parseInt(numero)
            for(let i=0; i<hijos.length-1; i++){
              numeroint+=1
              let posicion=letra+numeroint
              console.log(posicion)
              this.barco.push(posicion)
            }
            let terminar=false
            if(this.barcos.length>=1){
              console.log("ENTREEEEE")
              this.barcos.forEach(barcoposiciones => {
                console.log("ENTRREEEEEEE")
                barcoposiciones.forEach(posicion => {
                  console.log("ENTRRREEEEEE")
                  if(this.barco.includes(posicion)){
                    console.log("ENTRRRRRREEEEEEEEE")
                    alert("Has puesto el barco en una posicion donde ya ahi un barco ponlo en otro lado pendejo")
                    terminar=true
                  }
                });
              });
              console.log(terminar)
              if(!terminar){
                this.barcos.push(this.barco)
                for(let i=0; i<hijos.length; i++){
                  let posicion=document.getElementById(this.barco[i])
                  posicion.style.background='grey'
                }
                this.quitar=true
              }
            }else{
              this.barcos.push(this.barco)
              for(let i=0; i<hijos.length; i++){
                let posicion=document.getElementById(this.barco[i])
                posicion.style.background='grey'
              }
              this.quitar=true
            }
            console.log(this.quitar)
            console.log("Mi lista de barcos: ",this.barcos)
            }
            
          }
          if(this.ancho>54 && this.ancho<=108){
            console.log("Pongo la posicion dos")
            console.log("Esta seria mi letra"+Idsuelto[0])
            const letra=Idsuelto[0]
            if(Idsuelto.length<3){
              numero=Idsuelto[1]
            }else{
              numero=Idsuelto[1]+Idsuelto[2]
            }
            if(hijos.length==4 && (numero=="1"||numero=="10"||numero=="9")){
              alert("No puedes colocar el barco aqui no hay espacio suficiente")
              return
            }else if(hijos.length==3 && (numero=="1"||numero=="10")){
              alert("No puedes colocar el barco aqui no hay espacio suficiente")
              return
            }else{
              this.barco = [];
            let numeroint=parseInt(numero)
            this.barco.push(letra+(numeroint-1))
            this.barco.push(Idsuelto)
            if(hijos.length>=4){
              for(let i=0; i<2; i++){
                numeroint+=1
                console.log(letra)
                let posicion=letra+numeroint
                console.log(posicion)
                this.barco.push(posicion)
              }
            }else{
              this.barco.push(letra+(numeroint+1))
            }
            console.log("Mi barco es: "+this.barco)
            let terminar=false
            if(this.barcos.length>=1){
              console.log("ENTREEEEE")
              this.barcos.forEach(barcoposiciones => {
                console.log("ENTRREEEEEEE")
                barcoposiciones.forEach(posicion => {
                  console.log("ENTRRREEEEEE")
                  if(this.barco.includes(posicion)){
                    console.log("ENTRRRRRREEEEEEEEE")
                    alert("Has puesto el barco en una posicion donde ya ahi un barco ponlo en otro lado pendejo")
                    terminar=true
                  }
                });
              });
              console.log(terminar)
              if(!terminar){
                this.barcos.push(this.barco)
                for(let i=0; i<hijos.length; i++){
                  let posicion=document.getElementById(this.barco[i])
                  posicion.style.background='grey'
                }
                this.quitar=true
              }
            }else{
              this.barcos.push(this.barco)
              for(let i=0; i<hijos.length; i++){
                let posicion=document.getElementById(this.barco[i])
                posicion.style.background='grey'
              }
              this.quitar=true
            }
            console.log(this.quitar)
            console.log("Mi lista de barcos: "+this.barcos)
            }
            
          }
          if(this.ancho>108 && this.ancho<=162){
            console.log("Pongo la posicion tres")
            let posicionesanteriores=[]
            console.log("Esta seria mi letra"+Idsuelto[0])
            const letra=Idsuelto[0]
            if(Idsuelto.length<3){
              numero=Idsuelto[1]
            }else{
              numero=Idsuelto[1]+Idsuelto[2]
            }
            if(hijos.length==4 && (numero=="1"||numero=="2"||numero=="10")){
              alert("No puedes colocar el barco aqui no hay espacio suficiente")
              return
            }else if(hijos.length==3 && (numero=="1"||numero=="2")){
              alert("No puedes colocar el barco aqui no hay espacio suficiente")
              return
            }else{
              this.barco = [];
            /*let indice=this.letras.indexOf(letra)
            let indicesecundario=this.letras.indexOf(letra)*/
            let numeroint=parseInt(numero)
            for(let i=0; i<2; i++){
              numeroint-=1
              console.log(letra)
              let posicion=letra+numeroint
              console.log(posicion)
              posicionesanteriores.push(posicion)
            }
            posicionesanteriores=posicionesanteriores.reverse()
            for(let i=0; i<2; i++){
              this.barco.push(posicionesanteriores[i])
            }
            numeroint=parseInt(numero)
            this.barco.push(Idsuelto)
            if(hijos.length>=4){
              this.barco.push(letra+(numeroint+1))
            }
            console.log("Mi barco es: "+this.barco)
            let terminar=false
            if(this.barcos.length>=1){
              console.log("ENTREEEEE")
              this.barcos.forEach(barcoposiciones => {
                console.log("ENTRREEEEEEE")
                barcoposiciones.forEach(posicion => {
                  console.log("ENTRRREEEEEE")
                  if(this.barco.includes(posicion)){
                    console.log("ENTRRRRRREEEEEEEEE")
                    alert("Has puesto el barco en una posicion donde ya ahi un barco ponlo en otro lado pendejo")
                    terminar=true
                  }
                });
              });
              console.log(terminar)
              if(!terminar){
                this.barcos.push(this.barco)
                for(let i=0; i<hijos.length; i++){
                  let posicion=document.getElementById(this.barco[i])
                  posicion.style.background='grey'
                }
                this.quitar=true
              }
            }else{
              this.barcos.push(this.barco)
              for(let i=0; i<hijos.length; i++){
                let posicion=document.getElementById(this.barco[i])
                posicion.style.background='grey'
              }
              this.quitar=true
            }
            console.log(this.quitar)
            console.log("Mi lista de barcos: "+this.barcos)
            }
            
          }
          if(this.ancho>162 && this.ancho<=220){
            console.log("pongo la posicion cuatro")
            let posicionesanteriores=[]
            console.log("Esta seria mi letra"+Idsuelto[0])
            const letra=Idsuelto[0]
            if(Idsuelto.length<3){
              numero=Idsuelto[1]
            }else{
              numero=Idsuelto[1]+Idsuelto[2]
            }
            if(numero=="1"||numero=="2"||numero=="3"){
              alert("No puedes colocar el barco aqui no hay espacio suficiente")
              return
            }else{
              this.barco = [];
            let numeroint=parseInt(numero)
            for(let i=0; i<3; i++){
              numeroint-=1
              console.log(letra)
              let posicion=letra+numeroint
              console.log(posicion)
              posicionesanteriores.push(posicion)
            }
            posicionesanteriores=posicionesanteriores.reverse()
            for(let i=0; i<3; i++){
              this.barco.push(posicionesanteriores[i])
            }
            this.barco.push(Idsuelto)
            let terminar=false
            if(this.barcos.length>=1){
              console.log("ENTREEEEE")
              this.barcos.forEach(barcoposiciones => {
                console.log("ENTRREEEEEEE")
                barcoposiciones.forEach(posicion => {
                  console.log("ENTRRREEEEEE")
                  if(this.barco.includes(posicion)){
                    console.log("ENTRRRRRREEEEEEEEE")
                    alert("Has puesto el barco en una posicion donde ya ahi un barco ponlo en otro lado pendejo")
                    terminar=true
                  }
                });
              });
              console.log(terminar)
              if(!terminar){
                this.barcos.push(this.barco)
                for(let i=0; i<hijos.length; i++){
                  let posicion=document.getElementById(this.barco[i])
                  posicion.style.background='grey'
                }
                this.quitar=true
              }
            }else{
              this.barcos.push(this.barco)
              for(let i=0; i<hijos.length; i++){
                let posicion=document.getElementById(this.barco[i])
                posicion.style.background='grey'
              }
              this.quitar=true
            }
            console.log(this.quitar)
            console.log("Mi lista de barcos: "+this.barcos)
            }
          }
        }
        
        /*dropzone.append(item)*/
        if(this.quitar && (clase=="barco4-column"||clase=="barco4-row")){
          draggablebarco4.draggable=false
          draggablebarco4.style.display='none'
        }
        if(this.quitar && (clase=="barco3-column"||clase=="barco3-row")){
          draggablebarco3.draggable=false
          draggablebarco3.style.display='none'
        }
        if(this.quitar && (clase=="barco32-column"||clase=="barco32-row")){
          draggablebarco32.draggable=false
          draggablebarco32.style.display='none'
        }
        if(this.quitar && (clase=="barco2-column"||clase=="barco2-row")){
          draggablebarco2.draggable=false
          draggablebarco2.style.display='none'
        }
      });
    });
    /*dropzone.addEventListener("dragover", (ev) => ev.preventDefault());
    dropzone.addEventListener("drop", (ev) => {
      const id = ev.dataTransfer.getData("text/plain");
      const item = document.querySelector("#" + id);
      dropzone.append(item);
    });*/
  }
  cambiarposicionbarco4(){
    var barco4=document.getElementById("barco4");
    if(barco4.classList.contains("barco4-column")){
      barco4.classList.remove("barco4-column")
      barco4.classList.add("barco4-row")
    }else{
      barco4.classList.remove("barco4-row")
      barco4.classList.add("barco4-column")
    }
  }
  cambiarposicionbarco3(){
    var barco3=document.getElementById("barco3");
    if(barco3.classList.contains("barco3-column")){
      barco3.classList.remove("barco3-column")
      barco3.classList.add("barco3-row")
    }else{
      barco3.classList.remove("barco3-row")
      barco3.classList.add("barco3-column")
    }
  }
  cambiarposicionbarco32(){
    var barco32=document.getElementById("barco32");
    if(barco32.classList.contains("barco32-column")){
      barco32.classList.remove("barco32-column")
      barco32.classList.add("barco32-row")
    }else{
      barco32.classList.remove("barco32-row")
      barco32.classList.add("barco32-column")
    }
  }
  cambiarposicionbarco2(){
    var barco2=document.getElementById("barco2");
  if(barco2.classList.contains("barco2-column")){
    barco2.classList.remove("barco2-column")
    barco2.classList.add("barco2-row")
  }else{
    barco2.classList.remove("barco2-row")
    barco2.classList.add("barco2-column")
  }
  }
}
