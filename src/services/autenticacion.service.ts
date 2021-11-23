import {injectable, /* inject, */ BindingScope} from '@loopback/core';
import { repository } from '@loopback/repository';
import { Usuario } from '../models';
import { UsuarioRepository } from '../repositories';
const generador = require("password-generator");
const cryptojs = require("crypto-js");
const jwt = require("jsonwebtoken");
import { llaves } from '../config/llaves';
import { appendFile } from 'fs';

@injectable({scope:BindingScope.TRANSIENT})
export class AutenticacionService {
  validarTokenJWT(token: string) {
      throw new Error('Method not implemented.');
  }
  constructor(
    @repository(UsuarioRepository)
    public usuarioRepository : UsuarioRepository
  ) {}
  generarClave(){
    let clave = generador(8,false);
    return clave;
  }
  cifradoClave(clave:string){
    let claveCifrada = cryptojs.MD5(clave).toString();
    return claveCifrada;
  }
  identificarUsuario(Usuario:string, clave:string){
    try {
      let usuario = this.usuarioRepository.findOne({where: {correo: Usuario, contrasena: clave}});
      if (usuario) {
        return usuario;
      }
      return false;
    } catch (error) {
      return false;
    }
  }
  generarTokenJWT(usuario : Usuario){
    let token = jwt.sign({
      
      data: {
        id: usuario.id,
        correo: usuario.correo,
        nombre: usuario.nombre, 
        rol : usuario.rolId,
        nombreRol: usuario.nombreRol,
                
      },
    },
    llaves.claveJwt);
    return token;

  }
  validarToken(token : string){
    try {
      let datos = jwt.verify(token, llaves.claveJwt);
      return datos;
    } catch (error) {
      return false;
    }
  }
  cambiarContrasena(Usr:string){
    try {
      let usuario = this.usuarioRepository.findOne({where: {correo:Usr }});
      if(usuario){
        return usuario;
      }else{
        return false;
      }
    } catch (error) {
      return false
    }
  }

}
