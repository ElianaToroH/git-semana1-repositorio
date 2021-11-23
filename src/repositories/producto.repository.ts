import {inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, HasOneRepositoryFactory} from '@loopback/repository';
import {EcoMongoDbDataSource} from '../datasources';
import {Producto, ProductoRelations, Pedido} from '../models';
import {PedidoRepository} from './pedido.repository';

export class ProductoRepository extends DefaultCrudRepository<
  Producto,
  typeof Producto.prototype.id,
  ProductoRelations
> {

  public readonly pedido: HasOneRepositoryFactory<Pedido, typeof Producto.prototype.id>;

  constructor(
    @inject('datasources.EcoMongoDB') dataSource: EcoMongoDbDataSource, @repository.getter('PedidoRepository') protected pedidoRepositoryGetter: Getter<PedidoRepository>,
  ) {
    super(Producto, dataSource);
    this.pedido = this.createHasOneRepositoryFactoryFor('pedido', pedidoRepositoryGetter);
    this.registerInclusionResolver('pedido', this.pedido.inclusionResolver);
  }
}
