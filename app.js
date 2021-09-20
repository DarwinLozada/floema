require('dotenv').config()

const express = require('express')
const bodyParser = require('body-parser')
const path = require('path')
const errorHandlers = require('errorhandler')
const methodOverride = require('method-override')
const logger = require('morgan')

const API_ENDPOINT = process.env.PRISMIC_ENDPOINT
const ACCESS_TOKEN = process.env.PRISMIC_ACCESS_TOKEN

const Prismic = require('@prismicio/client')
const PrismicDOM = require('prismic-dom')

const app = express()
const port = 3000

app.use(logger('dev'))
app.use(errorHandlers())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(methodOverride())

const handleLinkResolver = (doc) => {
  return '/'
}

const initApi = (req) => {
  return Prismic.getApi(API_ENDPOINT, {
    accessToken: ACCESS_TOKEN,
    req
  })
}

app.use((req, res, next) => {
  res.locals.Links = handleLinkResolver

  // add PrismicDOM in locals to access them in templates.
  res.locals.PrismicDOM = PrismicDOM

  res.locals.Numbers = index => {
    return index === 0 ? 'One' : index === 1 ? 'Two' : index === 2 ? 'Three' : index === 3 ? 'Four' : index === 4
  }

  next()
})

app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'pug')

app.get('/', async (req, res) => {
  const api = await initApi(req)
  const metadata = await api.getSingle('metadata')
  const preloader = await api.getSingle('preloader')
  const home = await api.getSingle('home')

  const { results: collections } = await api.query(Prismic.Predicates.at('document.type', 'collection'), {
    fetchLinks: 'product.image'
  })

  res.render('pages/home', { meta: metadata, home, preloader, collections })
})

app.get('/about', async (req, res) => {
  const api = await initApi(req)
  const about = await api.getSingle('about')
  const preloader = await api.getSingle('preloader')
  const metadata = await api.getSingle('metadata')

  res.render('pages/about', { about, meta: metadata, preloader })
})

app.get('/collections', async (req, res) => {
  const api = await initApi(req)
  const home = await api.getSingle('home')
  const preloader = await api.getSingle('preloader')
  const metadata = await api.getSingle('metadata')

  const { results: collections } = await api.query(Prismic.Predicates.at('document.type', 'collection'), {
    fetchLinks: 'product.image'
  })

  res.render('pages/collections', { meta: metadata, collections, home, preloader })
})

app.get('/detail/:uid', async (req, res) => {
  const productUID = req.params.uid

  const api = await initApi(req)
  const preloader = await api.getSingle('preloader')
  const metadata = await api.getSingle('metadata')

  const product = await api.getByUID('product', productUID, {
    fetchLinks: 'collection.title'
  })

  res.render('pages/detail', { meta: metadata, product, preloader })
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
