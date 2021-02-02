import {
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  DeletedAt,
  ForeignKey,
  Model,
  Table,
  TableOptions,
  UpdatedAt,
} from 'sequelize-typescript';
import { User } from '../users/user.model';

const tableOptions: TableOptions = {
  tableName: 'Symptoms',
  timestamps: true,
  paranoid: true,
};

@Table(tableOptions)
export class Symptom extends Model<Symptom> {
  @Column({
    allowNull: false,
    primaryKey: true,
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
  })
  id: string;

  @Column({
    type: DataType.STRING,
  })
  name: string;

  @Column({
    type: DataType.INTEGER,
  })
  scale: number;

  @Column({
    type: DataType.STRING,
  })
  medication: string;

  @ForeignKey(() => User)
  @Column
  userId: string;

  @BelongsTo(() => User)
  user: User;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @DeletedAt
  deletedAt: Date;
}
