# Weather Intelligence Engine Package
from .weather_score import calculate_weather_score, get_score_profile
from .activity_engine import score_activities, score_custom_activity, get_best_time_window
from .weather_shift import detect_weather_shifts
from .forecast_compare import compare_forecasts
from .recommendation_engine import generate_what_should_i_do
from .decision_engine import evaluate_decision_cards
from .commute_travel_engine import evaluate_commute, generate_packing_list
from .astro_photo_engine import evaluate_stargazing, evaluate_photography
from .briefing_generator import generate_weather_brief, generate_weather_story
from .nlp_parser import parse_natural_query
from .ai_assistant import ask_atmos_ai
