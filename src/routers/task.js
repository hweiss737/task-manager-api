const express = require('express')
const mongoose = require('mongoose')
const Task = require('../models/task')
const auth = require('../middleware/auth')
const router = new express.Router()

router.post('/tasks', auth, async (req, res) => {
    const task = new Task({
        ...req.body,
        userId: req.user._id
    })
    try {
        await task.save()
        res.status(201).send(task)
    } catch(e) {
        res.status(400).send(e)
    }
})

router.get('/tasks', auth, async (req, res) => {
    const match = {}
    const sort = {}
    if(req.query.completed) {
        match.completed = eval(req.query.completed)
    }
    if(req.query.sortBy) {
        const parts = req.query.sortBy.split(':')
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1
    }
    try {
        await req.user.populate({
            path: 'tasks',
            match,
            options: {
                limit: req.query.limit ? parseInt(req.query.limit) : 0,
                skip: req.query.skip ? parseInt(req.query.skip) : 0,
                sort
            }
        })
        res.send(req.user.tasks)
    } catch(e) {
        res.status(500).send()
    }
})

router.get('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id
    if (!mongoose.isValidObjectId(_id)) {
        return res.status(404).send()
    }
    try {
        const task = await Task.findOne({_id, userId: req.user._id})
        if(!task) {
            return res.status(404).send()
        }
        res.send(task)
    } catch(e) {
        res.status(500).send(e)
    }
})

router.patch('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id
    if (!mongoose.isValidObjectId(_id)) {
        return res.status(400).send('Invalid id')
    }
    const updates = Object.keys(req.body)
    const allowedUpdates = ['description', 'completed']
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))
    if (!isValidOperation) {
        return res.status(400).send('Invalid update')
    }
    try {
        const task = await Task.findOne({_id, userId: req.user._id})
        if(!task) {
            return res.status(404).send()
        }
        updates.forEach((update) => task[update] = req.body[update])
        await task.save()
        res.send(task)
    } catch(e) {
        return res.status(400).send(e)
    }
})

router.delete('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id
    if (!mongoose.isValidObjectId(_id)) {
        return res.status(400).send('Invalid id')
    }
    try {
        const task = await Task.findOneAndDelete({_id, userId: req.user._id})
        if(!task) {
            return res.status(404).send()
        }
        res.send(task)
    } catch(e) {
        return res.status(400).send(e)
    }
})

module.exports = router