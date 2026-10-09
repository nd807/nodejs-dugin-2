const express = require('express')
const path = require('path')

const app = express()
const port = 3000

const categories = {
  business: { name: 'Бизнес', feed: 'business' },
  economic: { name: 'Экономика', feed: 'economics' },
  finances: { name: 'Финансы', feed: 'finance' },
  politics: { name: 'Политика', feed: 'politics' }
}

app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))
app.use(express.static(path.join(__dirname, 'public')))

app.get('/', (req, res) => {
  res.render('index')
})

app.get('/categories', (req, res) => {
  const result = Object.entries(categories).map(([value, category]) => ({
    value,
    name: category.name
  }))
  res.json(result)
})

app.get('/:count/news/for/:category', async (req, res) => {
  const count = Number(req.params.count)
  const category = req.params.category

  if (!Number.isInteger(count) || count <= 0) {
    return res.status(400).send('Количество новостей должно быть целым положительным числом')
  }

  if (!categories[category]) {
    return res.status(400).send('Такой категории нет')
  }

  try {
    const rssUrl = `https://www.vedomosti.ru/rss/rubric/${categories[category].feed}`
    const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`
    const response = await fetch(apiUrl)

    if (!response.ok) {
      throw new Error('Ошибка запроса')
    }

    const data = await response.json()

    if (data.status !== 'ok') {
      throw new Error('Сервис не вернул новости')
    }

    const items = Array.isArray(data.items) ? data.items : []
    const news = items.slice(0, count).map(item => ({
      title: item.title,
      description: String(item.description || 'Нет описания').replace(/<[^>]*>/g, '').trim(),
      link: item.link,
      date: item.pubDate ? new Date(item.pubDate).toLocaleString('ru-RU') : ''
    }))

    res.render('news', {
      count: news.length,
      category: categories[category].name,
      news
    })
  } catch (error) {
    res.status(500).send('Не удалось получить новости. Попробуйте позже')
  }
})

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Сервер запущен: http://localhost:${port}`)
  })
}

module.exports = app
