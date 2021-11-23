import {
  repository,
} from '@loopback/repository';
import {
  param,
  get,
  getModelSchemaRef,
} from '@loopback/rest';
import {
  Pedido,
  Usuario,
} from '../models';
import {PedidoRepository} from '../repositories';

export class PedidoUsuarioController {
  constructor(
    @repository(PedidoRepository)
    public pedidoRepository: PedidoRepository,
  ) { }

  @get('/pedidos/{id}/usuario', {
    responses: {
      '200': {
        description: 'Usuario belonging to Pedido',
        content: {
          'application/json': {
            schema: {type: 'array', items: getModelSchemaRef(Usuario)},
          },
        },
      },
    },
  })
  async getUsuario(
    @param.path.string('id') id: typeof Pedido.prototype.id,
  ): Promise<Usuario> {
    return this.pedidoRepository.usuario(id);
  }
}
