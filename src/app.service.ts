import { Client, MessageAPIResponseBase, WebhookEvent } from '@line/bot-sdk';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { Symptom } from './symptoms/symptom.model';
import { User } from './users/user.model';

@Injectable()
export class AppService {
  client: Client;

  constructor(
    @InjectModel(User) private userModel: typeof User,
    @InjectModel(Symptom) private symptomModel: typeof Symptom,
    private sequelize: Sequelize,
  ) {
    const { CHANNEL_ACCESS_TOKEN, CHANNEL_SECRET } = process.env;
    const config = {
      channelAccessToken: CHANNEL_ACCESS_TOKEN,
      channelSecret: CHANNEL_SECRET,
    };

    this.client = new Client(config);
  }

  updateUserAttribute(lineId: string, attribute: any) {
    return this.sequelize.transaction((transaction) =>
      this.userModel.update(
        { ...attribute },
        {
          where: { lineId },
          transaction,
        },
      ),
    );
  }

  async getUserByLineId(lineId: string): Promise<User> {
    const user = await this.userModel.findOne({
      where: { lineId },
    });
    return user;
  }

  async getSymptomByUser(user: User): Promise<Symptom> {
    const symptom = await this.symptomModel.findOne({
      where: { userId: user.id },
    });
    return symptom;
  }

  replyMessage(
    replyToken: string,
    text: string,
  ): Promise<MessageAPIResponseBase> {
    return this.client.replyMessage(replyToken, [{ type: 'text', text }]);
  }

  getHello(): string {
    return 'Hello World!';
  }

  async webhook(event: WebhookEvent) {
    const lineId = event.source.userId;

    if (event.type === 'follow') {
      const replyToken = event.replyToken;

      await this.sequelize.transaction((transaction) =>
        this.userModel.findOrCreate({
          where: {
            lineId,
          },
          defaults: {
            lineId,
          },
          transaction,
        }),
      );

      await this.replyMessage(
        replyToken,
        'Welcome to Fanita Health!\n\nPlease enter your name\n(/name <name>)',
      );
    }

    if (event.type === 'message' && event.message.type === 'text') {
      const text = event.message.text;
      const replyToken = event.replyToken;

      if (text.substr(0, 1) === '/') {
        const args = text.substr(1).split(' ');
        const type = args[0].toLowerCase();

        switch (type) {
          case 'name':
            const name = {
              name: args[1],
            };
            await this.updateUserAttribute(lineId, name);

            await this.replyMessage(
              replyToken,
              'Please enter your email address\n(/email <email>)',
            );
            break;
          case 'email':
            const email = {
              email: args[1].toLowerCase().trim(),
            };
            await this.updateUserAttribute(lineId, email);

            await this.replyMessage(
              replyToken,
              'How old are you?\n(/age <age>)',
            );
            break;
          case 'age':
            if (isNaN(parseInt(args[1], 10))) {
              await this.replyMessage(replyToken, 'Age must be a number.');
              break;
            }

            const age = {
              age: args[1],
            };
            await this.updateUserAttribute(lineId, age);

            await this.replyMessage(
              replyToken,
              'Please tell me how are you feeling today (scale of 1-10)\n(/feeling <1-10>)',
            );
            break;
          case 'feeling':
            if (
              isNaN(parseInt(args[1], 10)) ||
              parseInt(args[1], 10) < 1 ||
              parseInt(args[1], 10) > 10
            ) {
              await this.replyMessage(
                replyToken,
                'Input must be a number from 1-10.',
              );
              break;
            }

            const user = await this.getUserByLineId(lineId);
            await this.sequelize.transaction(async (transaction) => {
              const symptom = new Symptom({
                scale: args[1],
              });
              await symptom.$set('user', user, { transaction });
              await symptom.save({ transaction });
            });
            if (parseInt(args[1], 10) >= 7 && parseInt(args[1], 10) < 10) {
              await this.replyMessage(
                replyToken,
                "Keep up the good work!\nAlways eat properly, have proper rest, and workout regularly.\n\nIf you ever feel unwell, don't hesitate to talk with us!",
              );
            } else if (
              parseInt(args[1], 10) < 7 &&
              parseInt(args[1], 10) >= 1
            ) {
              await this.replyMessage(
                replyToken,
                'What symptoms are you experiencing? (separate symptoms using comma)\ne.g., cough, slight fever, etc.\n(/symptoms <symptom>)',
              );
            }
            break;
          case 'symptoms':
            const symptomUser = await this.getUserByLineId(lineId);

            await this.sequelize.transaction(async (transaction) => {
              const symptom = await this.symptomModel.findOne({
                where: {
                  userId: symptomUser.id,
                },
                order: [['createdAt', 'DESC']],
                transaction,
              });
              symptom.name = args[1];
              await symptom.save();
            });
            await this.client.replyMessage(event.replyToken, [
              {
                type: 'template',
                altText: 'Medication details',
                template: {
                  type: 'confirm',
                  actions: [
                    {
                      type: 'message',
                      label: 'Yes',
                      text: '/medication',
                    },
                    {
                      type: 'message',
                      label: 'No',
                      text: '/no-medication',
                    },
                  ],
                  text: 'Are you currently taking any medication?',
                },
              },
            ]);
            break;
          case 'medication':
            await this.replyMessage(
              replyToken,
              'Please list your medications\n(/medication <medication>)',
            );
            break;
          case 'no-medication':
            await this.client.replyMessage(event.replyToken, [
              {
                type: 'template',
                altText: 'Review data',
                template: {
                  type: 'confirm',
                  actions: [
                    {
                      type: 'message',
                      label: 'Yes',
                      text: '/review',
                    },
                    {
                      type: 'message',
                      label: 'No',
                      text: '/no-review',
                    },
                  ],
                  text:
                    'Thank you for the information! Our doctor will look over the data that you provided and send you a diagnosis soon!\n\nDo you want to see a review of your data?',
                },
              },
            ]);
            break;
          case 'medication-list':
            const medicationUser = await this.getUserByLineId(lineId);

            await this.sequelize.transaction((transaction) =>
              this.symptomModel.update(
                {
                  medication: args[1],
                },
                {
                  where: {
                    userId: medicationUser.id,
                  },
                  transaction,
                },
              ),
            );
            await this.client.replyMessage(event.replyToken, [
              {
                type: 'template',
                altText: 'Review data',
                template: {
                  type: 'confirm',
                  actions: [
                    {
                      type: 'message',
                      label: 'Yes',
                      text: '/review',
                    },
                    {
                      type: 'message',
                      label: 'No',
                      text: '/no-review',
                    },
                  ],
                  text:
                    'Thank you for the information! Our doctor will look over the data that you provided and send you a diagnosis soon!\n\nDo you want to see a review of your data?',
                },
              },
            ]);
            break;
          case 'review':
            const userData = await this.getUserByLineId(lineId);
            const symptomData = await this.symptomModel.findOne({
              where: {
                userId: userData.id,
              },
              order: [['createdAt', 'DESC']],
            });
            await this.replyMessage(
              replyToken,
              `Name: ${userData.name}\nEmail: ${userData.email}\nAge: ${userData.age}\nCondition: ${symptomData.scale}\nSymptoms: ${symptomData.name}\nMedications: ${symptomData.medication}`,
            );
            break;
          case 'no-review':
            await this.replyMessage(replyToken, 'Thank you for using Fanita!');
          default:
            await this.replyMessage(
              replyToken,
              'Command not found. Please try a different command.',
            );
            break;
        }
      }
    }
  }
}
