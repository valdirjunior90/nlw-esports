//ECMAScript Modules
import express from "express";
import cors from 'cors'
import { PrismaClient } from '@prisma/client'
import { convertHourStringToMinute } from "./utils/convert-hour-string-to-minute";
import { convertMinuteToHourString } from "./utils/convert-minutes-to-hour-string";

const app = express();

app.use(express.json())
app.use(cors())

const prisma = new PrismaClient({
    log: ['query']
});

//ROTAS

app.get('/games', async (request, response)=>{
    const games = await prisma.game.findMany({
        include:{
            _count:{
                select:{
                    ads:true
                }
            }
        }
    })
    return response.json(games)
});

app.get('/ads', async (request, response)=>{
    const ads = await prisma.ad.findMany()
    return response.json(ads);
});

app.get('/games/:id/ads', async (request, response)=>{
    const gameId = request.params.id
    const ads = await prisma.ad.findMany({
        select:{
            id:true,
            name:true,
            weekDays:true,
            useVoiceChannel:true,
            yearsPlaying:true,
            hourStart:true,
            hourEnd:true,
        },
        where:{
            gameId,
        },
        orderBy:{
            createdAt:'desc'
        }
    })
    return response.json(ads.map(ad=>{
        return {
            ...ad,
            weekDays:ad.weekDays.split(','),
            hourStart: convertMinuteToHourString(ad.hourStart),
            hourEnd: convertMinuteToHourString(ad.hourEnd)
        }
    }))
});

app.get('/ads/:id/discord', async (request, response)=>{
    const adId = request.params.id as string

    const ad = await prisma.ad.findUniqueOrThrow({
        select:{
            discord:true,
        },
        where:{
            id:adId
        }
    })
    return response.json({
        discord: ad.discord
    })
});

app.post('/games/:gameId/ads', async (request, response)=>{
    const gameId = request.params.gameId;
    const body:any = request.body;
    
    const ad = await prisma.ad.create({
        data:{
            gameId,
            name:body.name,
            yearsPlaying:body.yearsPlaying,
            discord:body.discord,
            weekDays:body.weekDays.join(','),
            hourStart:convertHourStringToMinute(body.hourStart),
            hourEnd: convertHourStringToMinute(body.hourEnd),
            useVoiceChannel:body.useVoiceChannel
        }
    })

    return response.status(201).json(ad);
});


app.listen(3333)