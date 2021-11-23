import { service } from '@loopback/core';
import {
  Count,
  CountSchema,
  Filter,
  FilterExcludingWhere,
  repository,
  Where,
} from '@loopback/repository';
import {
  post,
  param,
  get,
  getModelSchemaRef,
  patch,
  put,
  del,
  requestBody,
  response,
  HttpErrors,
} from '@loopback/rest';
import {Credenciales, Rol, Usuario} from '../models';
import {RolRepository, UsuarioRepository} from '../repositories';
//import {UsuarioRepository} from    '../repositories/usuario.repository';
import { AutenticacionService } from '../services';
import {llaves} from '../config/llaves';
import { promises } from 'dns';
const fetch = require('node-fetch');

export class UsuarioController {
  constructor(
    @repository(UsuarioRepository)
    public usuarioRepository : UsuarioRepository,
    @repository(RolRepository)
    public rolRepositorio : RolRepository,
    @service(AutenticacionService)
    public servicioAutenticacion : AutenticacionService
  ) {}

  //Cambiar contraseña

  @put('/cambiarComtrasena')
  @response(200,{
    description: "Cambiar una contraseña"
  })
  async cambiarContrasena(@requestBody() credenciales : Credenciales){
    let usuario = await this.servicioAutenticacion.cambiarContrasena(credenciales.usuario);
    if(usuario){
      let nuevaContrasena = this.servicioAutenticacion.generarClave();
      let nuevaContrasenaCifrada = this.servicioAutenticacion.cifradoClave(nuevaContrasena);

      let usuarioActualizado = await this.usuarioRepository.updateById(usuario.id,{contrasena: nuevaContrasenaCifrada});
      //notificación
      let destino = usuario.correo;
      let asunto = 'Registro Eco-Sastreria';
      let contenido = `Hola ${usuario.nombre}, su contraseña ahora es ${nuevaContrasena} y su rol es: ${usuario.rolId}.`
      fetch(`${llaves.urlServicioNotificaciones}/envio-correo?destino=${destino}&asunto=${asunto}&contenido=${contenido}`).then((data:any)=>{
      console.log(data);
      return usuarioActualizado;
    });
    }else{
      throw new HttpErrors['401']("Usuario no existe")
    }
  }

  //identificación de usuario

  @post('/identificarUsuario')
  @response(200,{
    description: "Identificar a un usuario con su rol"
  })
  async identificarUsuario(@requestBody() credenciales : Credenciales){
    let usuario = await this.servicioAutenticacion.identificarUsuario(credenciales.usuario, credenciales.contrasena);
    if (usuario){
      let token = this.servicioAutenticacion.generarTokenJWT(usuario);
      return{
        datos : {
          nombre: usuario.nombre,
          correo: usuario.correo,
          id : usuario.id,
          rol: usuario.rolId
          //nombrerol: usuario.nombrerol
        },
        tk: token
      }
    }else{
      throw new HttpErrors['401']("Datos incorrectos")
    }
  }
  
  @post('/usuarios')
  @response(200, {
    description: 'Usuario model instance',
    content: {'application/json': {schema: getModelSchemaRef(Usuario)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Usuario, {
            title: 'NewUsuario',
            exclude: ['id'],
          }),
        },
      },
    })
    usuario: Omit<Usuario, 'id'>,
  ): Promise<Usuario> {
   
    //asignar contraseña
    let clave = this.servicioAutenticacion.generarClave();
    let claceCifrada = this.servicioAutenticacion.cifradoClave(clave);
    usuario.contrasena = claceCifrada;
    //Esta ruta solo tendra el rol de cliente
    let rol = await this.rolRepositorio.findOne({where: {nombre : 'cliente'}});
    if(rol){
      usuario.rolId = `${rol.id}`
    }else{
      let nuevoRol= await this.rolRepositorio.create({nombre: 'cliente'})
      usuario.rolId = `${nuevoRol.id}`
    }
    let Usr= await this.usuarioRepository.create(usuario);
    
    //Notificación Usuario
    let destino = usuario.correo;
    let asunto = 'Registro Eco-Sastreria';
    let contenido = `Hola ${usuario.nombre}, su usuario es: ${usuario.correo}, su contraseña es: ${clave} y su rol es: ${usuario.rolId}.
    Bienvenido a eco-satreria`
    fetch(`${llaves.urlServicioNotificaciones}/envio-correo?destino=${destino}&asunto=${asunto}&contenido=${contenido}`).then((data:any)=>{
      console.log(data);
    });
    return usuario;

  }

  @get('/usuarios/count')
  @response(200, {
    description: 'Usuario model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(Usuario) where?: Where<Usuario>,
  ): Promise<Count> {
    return this.usuarioRepository.count(where);
  }

  @get('/usuarios')
  @response(200, {
    description: 'Array of Usuario model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Usuario, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(Usuario) filter?: Filter<Usuario>,
  ): Promise<Usuario[]> {
    return this.usuarioRepository.find(filter);
  }

  @patch('/usuarios')
  @response(200, {
    description: 'Usuario PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Usuario, {partial: true}),
        },
      },
    })
    usuario: Usuario,
    @param.where(Usuario) where?: Where<Usuario>,
  ): Promise<Count> {
    return this.usuarioRepository.updateAll(usuario, where);
  }

  @get('/usuarios/{id}')
  @response(200, {
    description: 'Usuario model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Usuario, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.string('id') id: string,
    @param.filter(Usuario, {exclude: 'where'}) filter?: FilterExcludingWhere<Usuario>
  ): Promise<Usuario> {
    return this.usuarioRepository.findById(id, filter);
  }

  @patch('/usuarios/{id}')
  @response(204, {
    description: 'Usuario PATCH success',
  })
  async updateById(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Usuario, {partial: true}),
        },
      },
    })
    usuario: Usuario,
  ): Promise<void> {
    await this.usuarioRepository.updateById(id, usuario);
  }

  @put('/usuarios/{id}')
  @response(204, {
    description: 'Usuario PUT success',
  })
  async replaceById(
    @param.path.string('id') id: string,
    @requestBody() usuario: Usuario,
  ): Promise<void> {
    await this.usuarioRepository.replaceById(id, usuario);
  }

  @del('/usuarios/{id}')
  @response(204, {
    description: 'Usuario DELETE success',
  })
  async deleteById(@param.path.string('id') id: string): Promise<void> {
    await this.usuarioRepository.deleteById(id);
  }
}
