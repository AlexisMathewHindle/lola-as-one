<template>
  <div class="c-home">
    <SectionComponent
      :title="'The LoLA Creative Space'"
      :backgroundImage="'/img/images/about_page_02.png'"
    />
    <CalendarComponent />
    <v-container>
      <div class="d-flex flex-column align-center">
        <h1 class="my-6">Art classes</h1>
        <div class="mb-6 d-flex flex-column align-center">
          <p class="mb-0">
            Visit the LoLA studio where your child can be freely creative in a
            warm and welcoming environment while you relax and unwind in our
            Cafe space.
          </p>
          <p>
            Sign up to a term of art classes or pop in for a weekend one-off
          </p>
        </div>
      </div>
    </v-container>
    <!-- TODO: The text about sessions seems to suggest it's auto charged -->
    <SplitComponent
      :imageSrc="'./img/images/lola_homepage_kids_art_club_ages 4-7.png'"
      :title="'After School Art Clubs ages 4+ | ages 4 – 8 | ages 9 – 13'"
      :description="'A joyful creative moment in your child’s week where they can learn about artists and art styles, explore new materials and have fun with art in a beautiful space!'"
      :infoList="[
        'Wednesday’s class (ages 4+) will look at a different themes, from Woods to World Art, from Christmas to Recycled Construction!',
        'Thursday’s Art Club (ages 4-8) and (ages 9-13) will be a creative journey through the history of Art! From Early Art, Frescoes and Renaissance, to Impressionism and Modern Art (among others!). Children who attend over the year will produce a Portfolio of work.',
        'Dates and times: Term-time week days.',
        'Sessions run in terms from September to July and are charged every half term.',
      ]"
      :buttons="[
        {
          text: 'Register for Wednesday (ages 4+)',
          color: '#D8B061',
          // link: `event-details/${term.abb}01_wed_artclub`,
          link: `event-details/aw01_wed_artclub`,
        },
        {
          text: 'Register for Thursday (ages 4-8)',
          color: '#D8B061',
          // link: `event-details/${term.abb}01_story_of_art_club_4_8`,
          link: `event-details/aw01_story_of_art_club_4_8`,
        },
        {
          text: 'Register for Thursday (ages 9-13)',
          color: '#D8B061',
          // link: `event-details/${term.abb}01_story_of_art_club_9_13`,
          link: `event-details/aw01_story_of_art_club_9_13`,
        },
      ]"
    />
    <ResponsiveImageGridComponent />
    <SplitComponent
      :imageSrc="'./img/images/lola_homepage_little_ones.png'"
      :title="'Little Ones | ages 2 - 4'"
      :description="'This class is all about the process and experimenting! LoLA for Little Ones is designed to help young children be creative at an early age. Each class explores new textures, styles and materials. The activities are focused on the process and the experience for the child, rather than on the end result itself.'"
      :infoList="[
        'We kindly ask that you stay and co-create with your little ones. These sessions are designed for 2 to 4 year olds.',
        'Dates and times: These sessions are on a first come first served basis. Please book online to secure a place in advance.',
      ]"
      :buttons="[
        {
          text: 'Register for Tuesday',
          color: '#D8B061',
          // link: `event-details/${term.abb}01_lo_tues`,
          link: `event-details/aw01_lo_tues`,
        },
        {
          text: 'Register for Friday',
          color: '#D8B061',
          // link: `event-details/${term.abb}01_lo_fri`,
          link: `event-details/aw01_lo_fri`,
        },
        {
          text: 'Register for Saturday',
          color: '#D8B061',
          // link: `event-details/${term.abb}01_sat_lo`,
          link: `event-details/aw01_sat_lo`,
        },
      ]"
      :reverseLayout="true"
    />
    <ResponsiveImageGridComponent />
    <SplitComponent
      :imageSrc="'./img/images/lola_homepage_open_studio.png'"
      :title="'Open Studio | All ages'"
      :description="'At the LoLA Studio there is always something to do! Whilst teaching workshops are not being held, come along to the cafe for a coffee whilst your child gets freely creative!'"
      :infoList="[
        'Open Studios are an invitation to come to the table and make/play with the open-ended projects provided. ',
        'Although there will be an adult present, this is not a set teaching session. We kindly ask that you stay within the LoLA Cafe and help your child if they need assistance. All materials will be provided, and aprons available, but please come in clothes they don’t mind painting in!',
        'Open studio tickets include a hot drink for an adult and a space for a child at the workshop table. The spaces are on a first come, first serve basis and are available to buy at the till and online. The sessions last for maximum one hour.',
      ]"
      :buttons="[
        {
          text: 'Click on calendar to register',
          color: '#D8B061',
          type: 'click',
        },
      ]"
    />
    <ResponsiveImageGridComponent />
    <SplitComponent
      :reverseLayout="true"
      :imageSrc="'./img/images/lola_homepage_home_ed.png'"
      :title="'Home Education | ages 5+'"
      :description="'The Home Education sessions aim to support home educators with their art curriculum. Following the same themes as the other art clubs at the studio, children will learn about artists and art styles and explore new materials, while having fun with art!'"
      :infoList="[
        'Dates and times: Term-time week days. Sessions run in terms from September to July and are charged every half term.',
      ]"
      :buttons="[
        {
          text: 'Register for Thurs (ages 5+)',
          color: '#D8B061',
          // link: `event-details/${term.abb}01_hed_8_11`,
          link: `event-details/aw01_hed_8_11`,
        },
      ]"
    />
    <!-- <ResponsiveImageGridComponent />
    <SplitComponent
      :imageSrc="'/img/images/lola_homepage_young_adults.png'"
      :title="'Young Adults Creative Club | Ages 12+'"
      :description="'A joyful creative moment in your Teen or pre-Teens’s week where they can relax and unwind and let their creative juices flow in a beautiful environment! There is no pressure or exam preparation in this group, simply a space where young people can come and explore new materials and be inspired by artists and art styles. '"
      :infoList="[
        'Each half term we will look at a new theme, and experiment with different art supplies and techniques each week',
        'Dates and times: Term-time week days. Sessions run in terms from September to July and are charged every half term.',
      ]"
      :buttons="[
        {
          text: 'Contact us to enquire on availability',
          color: '#D8B061',
          type: 'click',
        },
      ]"
    /> -->
    <ResponsiveImageGridComponent />
    <SplitComponent
      :reverseLayout="true"
      :imageSrc="'/img/images/lola_homepage_weekend.jpg'"
      :title="'Weekend Workshops | Themed | Ages 5+'"
      :description="'These weekend workshops are one off special classes where children get to go in depth on specific themes, or work in particular materials. These sessions are on a first come first served basis. Please sign up and book online to secure a place in advance. Dress for mess - we’ll provide art aprons for those who would like them.'"
      :infoList="[
        'These sessions are on a first come first served basis. Please sign up and book online to secure a place in advance.',
      ]"
      :buttons="[
        {
          text: 'Register for Saturdays (ages 5+)',
          color: '#D8B061',
          // link: `event-details/${term.abb}01_sat`,
          link: `event-details/aw01_sat`,
        },
      ]"
    />
    <ResponsiveImageGridComponent />
    <!-- TODO: NEED TO ADD ALT TAGS TO ALL IMAGES -->
    <!-- <SplitComponent
      :imageSrc="'/img/images/lola_homepage_family_workshops.jpg'"
      :title="'Family Workshops | Ages 5+'"
      :description="'What is more fun than being creative together?! These weekend workshops offer a perfect time to make art with loved ones, creating something together and spending screen-free quality one-on-one time with your children.'"
      :infoList="[
        'These sessions are on a first come first served basis. Please sign up and book online to secure a place in advance.',
      ]"
      :buttons="[
        {
          text: 'Register for Sunday',
          color: '#D8B061',
          link: `event-details/${term.abb}02_fam_sun`,
        },
      ]"
    />
    <ResponsiveImageGridComponent /> -->
    <SplitComponent
      :imageSrc="'/img/images/lola_homepage_holidays.jpeg'"
      :title="'Holiday Workshops at LoLA'"
      :description="'During school holidays LoLA offers a fabulous host of creative workshops for all ages! From Little Ones (ages 2-4) groups to fun art workshops for children ages 5+.'"
      :infoList="[
        'When a taught workshop is not being held, the LoLA Open Studio continues throughout the holidays, where the art table has projects and inspiration for your children to freely create while you relax and have a coffee in the Cafe!',
      ]"
      :buttons="[
        {
          text: 'See Holiday Schedule',
          color: '#D8B061',
          link: `summer-workshops`,
        },
      ]"
    />
    <ResponsiveImageGridComponent />
    <SplitComponent
      :imageSrc="'/img/images/lola_homepage_adult.jpeg'"
      :title="'Adult Art Evenings'"
      :description="'These creative evenings are a fantastic chance to get freely arty with friends! From colourful canvas painting to experimenting with printmaking techniques, these evenings offer the chance to relax and unwind in a beautiful space and allow your creative juices to flow!'"
      :infoList="[
        'Each adult class is focused on one open-ended project, starting at 7pm and finishing at 8.30pm',
        'Tickets include all art materials, a delicious cocktail and nibbles! ',
      ]"
      :buttons="[
        {
          text: 'See Adult Workshops Schedule',
          color: '#D8B061',
          link: `adult-art-workshops`,
        },
      ]"
    />
    <FullWidthBannerComponent
      class="mt-10"
      :imageSrc="'./img/images/homepage.png'"
    />
    <ResponsiveImageGridComponent />
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref } from "vue";

import { useStore } from "vuex";

import CalendarComponent from "../components/CalendarComponent.vue";
import SectionComponent from "../components/SectionComponent.vue";
import SplitComponent from "../components/SplitComponent.vue";
import FullWidthBannerComponent from "../components/FullWidthComponent.vue";
import ResponsiveImageGridComponent from "../components/ResponsiveImageGridComponent.vue";

export default defineComponent({
  name: "HomeView",

  components: {
    CalendarComponent,
    SectionComponent,
    SplitComponent,
    FullWidthBannerComponent,
    ResponsiveImageGridComponent,
  },

  setup() {
    const store = useStore();
    const term = ref({ abb: "" });
    const termTimes = [
      {
        name: "autumn",
        start: "05/09/2024",
        end: "19/12/2024",
        abb: "aw",
      },
      {
        name: "spring",
        start: "20/12/2024",
        end: "27/03/2025",
        abb: "sp",
      },
      {
        name: "summer",
        start: "15/04/2025",
        end: "24/07/2025",
        abb: "su",
      },
    ];

    const findCurrentTerm = () => {
      const currentDate = new Date();

      const currentTerm = termTimes.find((term) => {
        const [dayStart, monthStart, yearStart] = term.start.split("/");
        const [dayEnd, monthEnd, yearEnd] = term.end.split("/");

        const startDate = new Date(
          Number(yearStart),
          Number(monthStart) - 1,
          Number(dayStart)
        );
        const endDate = new Date(
          Number(yearEnd),
          Number(monthEnd) - 1,
          Number(dayEnd)
        );

        return currentDate >= startDate && currentDate <= endDate;
      });

      if (currentTerm) {
        term.value = currentTerm;
        store.commit("SET_CURRENT_TERM", term.value);
      } else {
        console.warn(
          "No current term found for the current date:",
          currentDate
        );
      }
    };
    onMounted(() => {
      findCurrentTerm();
      store.commit("SET_TERM_TIME", termTimes);
    });

    return {
      findCurrentTerm,
      term,
    };
  },
});
</script>
<style>
.free-taster {
  background-color: var(--yellow);
  width: 100%;
  padding: 40px 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
}

.content {
  max-width: 800px;
}

h2 {
  margin-bottom: 10px;
  font-size: 24px;
  font-weight: bold;
}

p {
  margin-bottom: 10px;
  line-height: 1.5;
}

.note {
  font-size: 14px;
  font-style: italic;
}
</style>
